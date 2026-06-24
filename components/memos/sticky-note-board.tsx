"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ErrorMessage, Loading } from "@/components/ui/feedback";
import { StickyNote, type StickyNoteData } from "@/components/memos/sticky-note";
import { StickyNoteAssignModal } from "@/components/memos/sticky-note-assign-modal";
import {
  MemoBoardAxisEdgeIcons,
  MemoBoardQuadrantGrid,
} from "@/components/memos/memo-board-quadrant-grid";
import {
  computeMemoBoardSize,
  DEFAULT_STICKY_HEIGHT,
  DEFAULT_STICKY_WIDTH,
  defaultPositionForQuadrant,
  detectMemoQuadrant,
  isMemoQuadrantId,
  readMemoBoardAxisFromStorage,
  writeMemoBoardAxisToStorage,
  type MemoBoardAxis,
  type MemoQuadrantId,
} from "@/lib/memo-quadrant";
import { effectiveStickyPosition, nextStickyColor } from "@/lib/memo-sticky";

type NoteState = StickyNoteData & { x: number; y: number };

function MemoBoardSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const expanded = open || value.trim().length > 0;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="flex items-center gap-1">
      {expanded && (
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("memos.searchPlaceholder")}
          className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm sm:w-40 dark:border-gray-700 dark:bg-gray-900"
        />
      )}
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (!next && !value.trim()) onChange("");
            return next;
          });
        }}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label={t("memos.searchAria")}
        title={t("memos.searchAria")}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
        </svg>
      </button>
    </div>
  );
}

export function StickyNoteBoard() {
  const { t } = useI18n();
  const [notes, setNotes] = useState<NoteState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignNoteId, setAssignNoteId] = useState<string | null>(null);
  const [boardAxis, setBoardAxis] = useState<MemoBoardAxis>(() => readMemoBoardAxisFromStorage());
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
  const maxZRef = useRef(1);
  const boardRef = useRef<HTMLDivElement>(null);

  const persistNote = useCallback(async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/memos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? t("common.saveFailed"));
  }, [t]);

  const load = useCallback(async () => {
    const res = await fetch("/api/memos?standaloneOnly=true");
    const data = await res.json();
    const memos: StickyNoteData[] = data.memos ?? [];
    maxZRef.current = Math.max(1, ...memos.map((m) => m.zIndex ?? 1));

    const mapped = memos.map((memo, index) => {
      const pos = effectiveStickyPosition(memo.posX, memo.posY, index);
      return { ...memo, x: pos.x, y: pos.y };
    });

    const board = computeMemoBoardSize(
      boardRef.current?.clientWidth ?? viewportSize.width,
      boardRef.current?.clientHeight ?? viewportSize.height,
      mapped,
    );

    const reconciled: NoteState[] = [];
    for (const note of mapped) {
      const { width, height } = {
        width: note.width ?? DEFAULT_STICKY_WIDTH,
        height: note.height ?? DEFAULT_STICKY_HEIGHT,
      };
      const expected = detectMemoQuadrant(
        note.x,
        note.y,
        width,
        height,
        board.width,
        board.height,
        boardAxis,
      );
      if (note.quadrant !== expected) {
        reconciled.push({ ...note, quadrant: expected });
        void persistNote(note.id, { quadrant: expected }).catch(() => {});
      } else {
        reconciled.push(note);
      }
    }

    setNotes(reconciled);
  }, [boardAxis, persistNote, viewportSize.width, viewportSize.height]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const updateViewport = () => {
      setViewportSize({ width: board.clientWidth, height: board.clientHeight });
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(board);
    return () => observer.disconnect();
  }, [loading]);

  const boardSize = useMemo(
    () => computeMemoBoardSize(viewportSize.width, viewportSize.height, notes),
    [viewportSize.width, viewportSize.height, notes],
  );

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const text = [n.title, n.body, n.description].filter(Boolean).join(" ").toLowerCase();
      return text.includes(q);
    });
  }, [notes, search]);

  function patchNote(id: string, patch: Partial<NoteState>) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function noteSize(note: NoteState) {
    return {
      width: note.width ?? DEFAULT_STICKY_WIDTH,
      height: note.height ?? DEFAULT_STICKY_HEIGHT,
    };
  }

  function detectQuadrant(x: number, y: number, width: number, height: number) {
    return detectMemoQuadrant(x, y, width, height, boardSize.width, boardSize.height, boardAxis);
  }

  function reconcileQuadrantsForAxis(axis: MemoBoardAxis) {
    setNotes((prev) =>
      prev.map((note) => {
        const { width, height } = noteSize(note);
        const expected = detectMemoQuadrant(
          note.x,
          note.y,
          width,
          height,
          boardSize.width,
          boardSize.height,
          axis,
        );
        if (note.quadrant !== expected) {
          void persistNote(note.id, { quadrant: expected }).catch(() => {});
          return { ...note, quadrant: expected };
        }
        return note;
      }),
    );
  }

  function handleAxisCommit(axis: MemoBoardAxis) {
    setBoardAxis(axis);
    writeMemoBoardAxisToStorage(axis);
    reconcileQuadrantsForAxis(axis);
  }

  function handleMove(id: string, x: number, y: number) {
    patchNote(id, { x, y });
  }

  function handleMoveEnd(id: string, x: number, y: number) {
    const note = notes.find((n) => n.id === id);
    const { width, height } = note ? noteSize(note) : { width: DEFAULT_STICKY_WIDTH, height: DEFAULT_STICKY_HEIGHT };
    const quadrant = detectQuadrant(x, y, width, height);
    patchNote(id, { x, y, posX: x, posY: y, quadrant });
    void persistNote(id, { posX: x, posY: y, quadrant }).catch((e) =>
      setError(e instanceof Error ? e.message : t("memos.errors.savePosition")),
    );
  }

  function handleResize(id: string, width: number, height: number) {
    patchNote(id, { width, height });
  }

  function handleResizeEnd(id: string, width: number, height: number) {
    const note = notes.find((n) => n.id === id);
    const x = note?.x ?? 0;
    const y = note?.y ?? 0;
    const quadrant = detectQuadrant(x, y, width, height);
    patchNote(id, { width, height, quadrant });
    void persistNote(id, { width, height, quadrant }).catch((e) =>
      setError(e instanceof Error ? e.message : t("memos.errors.saveSize")),
    );
  }

  function handleActivate(id: string) {
    maxZRef.current += 1;
    const z = maxZRef.current;
    patchNote(id, { zIndex: z });
    setActiveId(id);
    void persistNote(id, { zIndex: z }).catch(() => {});
  }

  async function handleUpdate(id: string, patch: Partial<StickyNoteData & { content: string }>) {
    const note = notes.find((n) => n.id === id);
    let persistBody: Record<string, unknown> = { ...patch };

    if (patch.quadrant !== undefined && note) {
      const nextQuadrant = patch.quadrant as MemoQuadrantId | null;
      if (nextQuadrant && isMemoQuadrantId(nextQuadrant) && note.quadrant !== nextQuadrant) {
        const peerCount = notes.filter((n) => n.quadrant === nextQuadrant && n.id !== id).length;
        const pos = defaultPositionForQuadrant(
          nextQuadrant,
          boardSize.width,
          boardSize.height,
          peerCount,
          boardAxis,
        );
        persistBody = { ...persistBody, posX: pos.x, posY: pos.y };
        patchNote(id, {
          quadrant: nextQuadrant,
          x: pos.x,
          y: pos.y,
          posX: pos.x,
          posY: pos.y,
        });
      } else {
        patchNote(id, { quadrant: nextQuadrant });
      }
    }

    if (patch.color) patchNote(id, { color: patch.color });
    try {
      await persistNote(id, persistBody);
      if (patch.content !== undefined) {
        setEditingId(null);
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.saveFailed"));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("common.confirmDeleteNote"))) return;
    try {
      const res = await fetch(`/api/memos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("common.deleteFailed"));
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.deleteFailed"));
    }
  }

  async function handleAdd() {
    setError("");
    const board = boardRef.current;
    const scrollLeft = board?.scrollLeft ?? 0;
    const scrollTop = board?.scrollTop ?? 0;
    const viewW = board?.clientWidth ?? viewportSize.width;
    const viewH = board?.clientHeight ?? viewportSize.height;
    const posX = scrollLeft + Math.max(0, (viewW - DEFAULT_STICKY_WIDTH) / 2);
    const posY = scrollTop + Math.max(0, (viewH - DEFAULT_STICKY_HEIGHT) / 2);
    const quadrant = detectQuadrant(posX, posY, DEFAULT_STICKY_WIDTH, DEFAULT_STICKY_HEIGHT);

    try {
      const res = await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empty: true,
          color: nextStickyColor(notes.length),
          posX,
          posY,
          quadrant,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("common.createFailed"));
      await load();
      if (data.memo?.id) {
        setActiveId(data.memo.id);
        setEditingId(data.memo.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.createFailed"));
    }
  }

  async function handleAssignSubmit(data: {
    parentPlanId: string | null;
    startDate: string | null;
    endDate: string | null;
  }) {
    if (!assignNoteId) return;
    const res = await fetch(`/api/memos/${assignNoteId}/assign-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? t("memos.assignModal.assignFailed"));
    setNotes((prev) => prev.filter((n) => n.id !== assignNoteId));
    setAssignNoteId(null);
    if (activeId === assignNoteId) setActiveId(null);
  }

  const assignNote = assignNoteId ? notes.find((n) => n.id === assignNoteId) : null;

  if (loading) return <Loading label={t("memos.loading")} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("memos.title")}</h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void handleAdd()}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title={t("memos.newNote")}
            aria-label={t("memos.newNote")}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <MemoBoardSearch value={search} onChange={setSearch} />
        </div>
      </header>

      {error && <ErrorMessage message={error} className="mb-2 shrink-0" />}

      <div className="relative min-h-0 flex-1">
        <MemoBoardAxisEdgeIcons />

        <div
          ref={boardRef}
          className="relative h-full overflow-auto rounded-xl border border-gray-300 bg-[#f5f0e8] dark:border-gray-600 dark:bg-[#2a2824]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          onPointerDown={() => {
            setActiveId(null);
            setEditingId(null);
          }}
        >
          <div
            className="relative"
            style={{
              width: boardSize.width,
              height: boardSize.height,
              minWidth: "100%",
              minHeight: "100%",
            }}
          >
            <MemoBoardQuadrantGrid
              boardWidth={boardSize.width}
              boardHeight={boardSize.height}
              axis={boardAxis}
              onAxisChange={setBoardAxis}
              onAxisCommit={handleAxisCommit}
            />

            {filteredNotes.length === 0 && search.trim() && (
              <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center text-sm text-gray-500">
                {t("memos.noResults")}
              </div>
            )}

            <div className="absolute inset-0 z-10">
              {filteredNotes.map((note) => (
                <StickyNote
                  key={note.id}
                  note={note}
                  x={note.x}
                  y={note.y}
                  isActive={activeId === note.id}
                  startInEditMode={editingId === note.id}
                  onActivate={() => handleActivate(note.id)}
                  onMove={handleMove}
                  onMoveEnd={handleMoveEnd}
                  onResize={handleResize}
                  onResizeEnd={handleResizeEnd}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onAssign={(id) => setAssignNoteId(id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <StickyNoteAssignModal
        key={assignNoteId ?? "closed"}
        open={Boolean(assignNote)}
        noteTitle={assignNote?.title ?? t("memos.note.defaultTitle")}
        onClose={() => setAssignNoteId(null)}
        onSubmit={handleAssignSubmit}
      />
    </div>
  );
}
