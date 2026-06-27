"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ErrorMessage, Loading } from "@/components/ui/feedback";
import { StickyNote, type StickyNoteData } from "@/components/memos/sticky-note";
import { StickyNoteAssignModal } from "@/components/memos/sticky-note-assign-modal";
import { MemoQuadrantTabs } from "@/components/memos/memo-quadrant-tabs";
import { MemoMobileCard } from "@/components/memos/memo-mobile-card";
import {
  MemoBoardAxisEdgeIcons,
  MemoBoardQuadrantGrid,
} from "@/components/memos/memo-board-quadrant-grid";
import { useMobileShell } from "@/hooks/use-mobile-shell";
import {
  computeMemoBoardSize,
  DEFAULT_MEMO_BOARD_AXIS,
  DEFAULT_STICKY_HEIGHT,
  DEFAULT_STICKY_WIDTH,
  defaultPositionForQuadrant,
  detectMemoQuadrant,
  isMemoQuadrantId,
  resolveStickyNotePlacement,
  type MemoQuadrantId,
} from "@/lib/memo-quadrant";
import { effectiveStickyPosition, nextStickyColor } from "@/lib/memo-sticky";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { dispatchMemoUpdated } from "@/lib/memo-events";
import { apiJson } from "@/lib/client-api";
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
  const router = useRouter();
  const isMobileShell = useMobileShell();
  const [notes, setNotes] = useState<NoteState[]>([]);
  const [activeQuadrant, setActiveQuadrant] = useState<MemoQuadrantId>("not_urgent_important");
  const [loading, setLoading] = useState(true);
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

  const notifyMemoUpdated = useCallback(
    (detail?: { memo?: StickyNoteData; removeId?: string }) => {
      dispatchMemoUpdated(detail);
    },
    [],
  );

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

      const quadrantCounts = new Map<MemoQuadrantId, number>();
      const layoutFixes: Array<{
        id: string;
        posX: number;
        posY: number;
        quadrant: string | null;
      }> = [];
      const reconciled: NoteState[] = [];

      for (const note of mapped) {
        const qId = isMemoQuadrantId(note.quadrant) ? note.quadrant : null;
        const indexInQuadrant = qId ? (quadrantCounts.get(qId) ?? 0) : 0;
        if (qId) quadrantCounts.set(qId, indexInQuadrant + 1);

        const placement = resolveStickyNotePlacement({
          quadrant: note.quadrant,
          posX: note.posX,
          posY: note.posY,
          width: note.width,
          height: note.height,
          boardWidth: board.width,
          boardHeight: board.height,
          indexInQuadrant,
        });

        const next: NoteState = {
          ...note,
          x: placement.x,
          y: placement.y,
          posX: placement.x,
          posY: placement.y,
          quadrant: placement.quadrant,
        };

        if (
          note.posX !== placement.x ||
          note.posY !== placement.y ||
          note.quadrant !== placement.quadrant
        ) {
          layoutFixes.push({
            id: note.id,
            posX: placement.x,
            posY: placement.y,
            quadrant: placement.quadrant,
          });
        }
        reconciled.push(next);
      }

      if (layoutFixes.length > 0) {
        void batchPersistLayout(layoutFixes).catch(() => {});
      }

      setNotes(reconciled);
    },
    [batchPersistLayout],
  );

  const loadMemos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiJson<{ memos?: StickyNoteData[] }>(
        `/api/memos?standaloneOnly=true&_=${Date.now()}`,
      );
      await reconcileMemos(data.memos ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [reconcileMemos, t]);

  useEffect(() => {
    void loadMemos();
  }, [loadMemos]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || loading) return;

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

  const displayNotes = useMemo(() => {
    if (!isMobileShell) return filteredNotes;
    return filteredNotes.filter((note) => {
      const stored = note.quadrant;
      if (stored && isMemoQuadrantId(stored)) return stored === activeQuadrant;
      const { width, height } = {
        width: note.width ?? DEFAULT_STICKY_WIDTH,
        height: note.height ?? DEFAULT_STICKY_HEIGHT,
      };
      return (
        detectMemoQuadrant(
          note.x,
          note.y,
          width,
          height,
          boardSize.width,
          boardSize.height,
          DEFAULT_MEMO_BOARD_AXIS,
        ) === activeQuadrant
      );
    });
  }, [filteredNotes, isMobileShell, activeQuadrant, boardSize.width, boardSize.height]);

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
      notifyMemoUpdated({ removeId: id });
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
    let posX = scrollLeft + Math.max(0, (viewW - DEFAULT_STICKY_WIDTH) / 2);
    let posY = scrollTop + Math.max(0, (viewH - DEFAULT_STICKY_HEIGHT) / 2);
    let quadrant: MemoQuadrantId;
    if (isMobileShell) {
      quadrant = activeQuadrant;
      const peerCount = notes.filter((n) => n.quadrant === activeQuadrant).length;
      const pos = defaultPositionForQuadrant(
        activeQuadrant,
        boardSize.width,
        boardSize.height,
        peerCount,
        DEFAULT_MEMO_BOARD_AXIS,
      );
      posX = pos.x;
      posY = pos.y;
    } else {
      quadrant = detectQuadrant(posX, posY, DEFAULT_STICKY_WIDTH, DEFAULT_STICKY_HEIGHT);
    }
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
      const data = await apiJson<{ memo?: StickyNoteData; error?: string }>("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empty: true,
          color,
          posX,
          posY,
          quadrant,
        }),
      });

      const memo = data.memo;
      if (!memo) throw new Error(t("common.createFailed"));
      const pos = effectiveStickyPosition(memo.posX, memo.posY, notes.length);
      const saved: NoteState = { ...memo, x: pos.x, y: pos.y };

      setNotes((prev) => prev.map((n) => (n.id === tempId ? saved : n)));
      setActiveId(saved.id);
      setEditingId(saved.id);
      dispatchMemoUpdated({ memo });
      router.refresh();
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
    notifyMemoUpdated({ removeId: assignNoteId });
    router.refresh();
    await loadMemos();
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

      {isMobileShell && (
        <MemoQuadrantTabs value={activeQuadrant} onChange={setActiveQuadrant} />
      )}

      {isMobileShell ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {displayNotes.length === 0 && !search.trim() && (
              <p className="py-8 text-center text-sm text-gray-400">{t("memos.note.clickToEdit")}</p>
            )}
            {displayNotes.length === 0 && search.trim() && (
              <p className="py-8 text-center text-sm text-gray-400">{t("memos.noResults")}</p>
            )}
            <div className="flex flex-col gap-2">
              {displayNotes.map((note) => (
                <MemoMobileCard
                  key={note.id}
                  note={note}
                  isEditing={editingId === note.id}
                  onStartEdit={() => {
                    handleActivate(note.id);
                    setEditingId(note.id);
                  }}
                  onEndEdit={() => setEditingId(null)}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onAssign={(id) => setAssignNoteId(id)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
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

            {displayNotes.length === 0 && search.trim() && (
              <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center text-sm text-gray-500">
                {t("memos.noResults")}
              </div>
            )}

            <div className="absolute inset-0 z-10">
              {displayNotes.map((note) => (
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
      )}

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
