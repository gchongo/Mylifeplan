"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  DEFAULT_MEMO_BOARD_AXIS,
  DEFAULT_STICKY_HEIGHT,
  DEFAULT_STICKY_WIDTH,
  defaultPositionForQuadrant,
  detectMemoQuadrant,
  isMemoQuadrantId,
  type MemoQuadrantId,
} from "@/lib/memo-quadrant";
import { effectiveStickyPosition, nextStickyColor } from "@/lib/memo-sticky";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { dispatchMemoUpdated } from "@/lib/memo-events";
import { queryKeys } from "@/lib/query/keys";
import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";

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
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignNoteId, setAssignNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
  const maxZRef = useRef(1);
  const boardRef = useRef<HTMLDivElement>(null);
  const creatingRef = useRef(false);

  const { data: rawMemos, isLoading: loading, error: queryError } = useQuery({
    queryKey: queryKeys.memos.standalone,
    queryFn: async () => {
      const res = await fetch("/api/memos?standaloneOnly=true", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("common.loadFailed"));
      return (data.memos ?? []) as StickyNoteData[];
    },
  });

  useEffect(() => {
    if (queryError instanceof Error) {
      setError(queryError.message);
    } else if (queryError) {
      setError(t("common.loadFailed"));
    } else {
      setError("");
    }
  }, [queryError, t]);

  const notifyMemoUpdated = useCallback(() => {
    dispatchMemoUpdated();
  }, []);

  const persistNote = useCallback(async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/memos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? t("common.saveFailed"));
  }, [t]);

  const batchPersistLayout = useCallback(
    async (
      updates: Array<{
        id: string;
        posX?: number;
        posY?: number;
        zIndex?: number;
        quadrant?: string | null;
        width?: number;
        height?: number;
      }>,
    ) => {
      if (updates.length === 0) return;
      const res = await fetch("/api/memos/batch-layout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("common.saveFailed"));
    },
    [t],
  );

  const zIndexPendingRef = useRef<Map<string, number>>(new Map());
  const zIndexTimerRef = useRef<number | null>(null);

  const scheduleZIndexPersist = useCallback(
    (id: string, zIndex: number) => {
      zIndexPendingRef.current.set(id, zIndex);
      if (zIndexTimerRef.current != null) {
        window.clearTimeout(zIndexTimerRef.current);
      }
      zIndexTimerRef.current = window.setTimeout(() => {
        zIndexTimerRef.current = null;
        const updates = Array.from(zIndexPendingRef.current.entries()).map(([noteId, z]) => ({
          id: noteId,
          zIndex: z,
        }));
        zIndexPendingRef.current.clear();
        void batchPersistLayout(updates).catch(() => {});
      }, 400);
    },
    [batchPersistLayout],
  );

  const reconcileMemos = useCallback(
    async (memos: StickyNoteData[]) => {
      maxZRef.current = Math.max(1, ...memos.map((m) => m.zIndex ?? 1));

      const viewW = boardRef.current?.clientWidth ?? 800;
      const viewH = boardRef.current?.clientHeight ?? 600;

      const mapped = memos.map((memo, index) => {
        const pos = effectiveStickyPosition(memo.posX, memo.posY, index);
        return { ...memo, x: pos.x, y: pos.y };
      });

      const board = computeMemoBoardSize(viewW, viewH, mapped);

      const quadrantFixes: Array<{ id: string; quadrant: string }> = [];
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
          DEFAULT_MEMO_BOARD_AXIS,
        );
        if (note.quadrant !== expected) {
          reconciled.push({ ...note, quadrant: expected });
          quadrantFixes.push({ id: note.id, quadrant: expected });
        } else {
          reconciled.push(note);
        }
      }

      if (quadrantFixes.length > 0) {
        void batchPersistLayout(
          quadrantFixes.map((item) => ({ id: item.id, quadrant: item.quadrant })),
        ).catch(() => {});
      }

      setNotes(reconciled);
    },
    [batchPersistLayout],
  );

  useEffect(() => {
    if (!rawMemos) return;
    void reconcileMemos(rawMemos);
  }, [rawMemos, reconcileMemos]);

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
    return detectMemoQuadrant(
      x,
      y,
      width,
      height,
      boardSize.width,
      boardSize.height,
      DEFAULT_MEMO_BOARD_AXIS,
    );
  }

  function handleMoveEnd(id: string, x: number, y: number) {
    const note = notes.find((n) => n.id === id);
    const { width, height } = note ? noteSize(note) : { width: DEFAULT_STICKY_WIDTH, height: DEFAULT_STICKY_HEIGHT };
    const quadrant = detectQuadrant(x, y, width, height);
    patchNote(id, { x, y, posX: x, posY: y, quadrant });
    void persistNote(id, { posX: x, posY: y, quadrant }).then(() => notifyMemoUpdated()).catch((e) =>
      setError(e instanceof Error ? e.message : t("memos.errors.savePosition")),
    );
  }

  function handleResizeEnd(id: string, width: number, height: number) {
    const note = notes.find((n) => n.id === id);
    const x = note?.x ?? 0;
    const y = note?.y ?? 0;
    const quadrant = detectQuadrant(x, y, width, height);
    patchNote(id, { width, height, quadrant });
    void persistNote(id, { width, height, quadrant }).then(() => notifyMemoUpdated()).catch((e) =>
      setError(e instanceof Error ? e.message : t("memos.errors.saveSize")),
    );
  }

  function handleActivate(id: string) {
    maxZRef.current += 1;
    const z = maxZRef.current;
    patchNote(id, { zIndex: z });
    setActiveId(id);
    scheduleZIndexPersist(id, z);
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
          DEFAULT_MEMO_BOARD_AXIS,
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
      notifyMemoUpdated();
      if (patch.content !== undefined) {
        setEditingId(null);
        patchNote(id, {
          title: patch.content.split("\n")[0]?.slice(0, 80) || note?.title || "",
          body: patch.content,
        });
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
      notifyMemoUpdated();
      if (editingId === id) setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.deleteFailed"));
    }
  }

  async function handleAdd() {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setIsCreating(true);
    setError("");

    const board = boardRef.current;
    const scrollLeft = board?.scrollLeft ?? 0;
    const scrollTop = board?.scrollTop ?? 0;
    const viewW = board?.clientWidth ?? viewportSize.width;
    const viewH = board?.clientHeight ?? viewportSize.height;
    const posX = scrollLeft + Math.max(0, (viewW - DEFAULT_STICKY_WIDTH) / 2);
    const posY = scrollTop + Math.max(0, (viewH - DEFAULT_STICKY_HEIGHT) / 2);
    const quadrant = detectQuadrant(posX, posY, DEFAULT_STICKY_WIDTH, DEFAULT_STICKY_HEIGHT);
    const color = nextStickyColor(notes.length);
    const tempId = `temp-${Date.now()}`;
    maxZRef.current += 1;

    const optimistic: NoteState = {
      id: tempId,
      title: "",
      description: null,
      body: null,
      posX,
      posY,
      zIndex: maxZRef.current,
      color,
      quadrant,
      width: DEFAULT_STICKY_WIDTH,
      height: DEFAULT_STICKY_HEIGHT,
      updatedAt: new Date().toISOString(),
      x: posX,
      y: posY,
    };

    setNotes((prev) => [...prev, optimistic]);
    setActiveId(tempId);
    setEditingId(tempId);

    try {
      const res = await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          empty: true,
          color,
          posX,
          posY,
          quadrant,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("common.createFailed"));

      const memo = data.memo as StickyNoteData;
      const pos = effectiveStickyPosition(memo.posX, memo.posY, notes.length);
      const saved: NoteState = { ...memo, x: pos.x, y: pos.y };

      setNotes((prev) => prev.map((n) => (n.id === tempId ? saved : n)));
      setActiveId(saved.id);
      setEditingId(saved.id);
    } catch (e) {
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      setActiveId((current) => (current === tempId ? null : current));
      setEditingId((current) => (current === tempId ? null : current));
      setError(e instanceof Error ? e.message : t("common.createFailed"));
    } finally {
      creatingRef.current = false;
      setIsCreating(false);
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
    dispatchPlanUpdated({ plan: body.plan as SerializedPlanForGantt });
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
            disabled={isCreating}
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
            <MemoBoardQuadrantGrid boardWidth={boardSize.width} boardHeight={boardSize.height} />

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
                  onMoveEnd={handleMoveEnd}
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
