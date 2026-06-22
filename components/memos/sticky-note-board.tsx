"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage, Loading } from "@/components/ui/feedback";
import { StickyNote, type StickyNoteData } from "@/components/memos/sticky-note";
import { StickyNoteAssignModal } from "@/components/memos/sticky-note-assign-modal";
import {
  DEFAULT_STICKY_HEIGHT,
  DEFAULT_STICKY_WIDTH,
  detectMemoQuadrant,
  MEMO_QUADRANT_BOARD_HEIGHT,
  MEMO_QUADRANT_BOARD_WIDTH,
  MEMO_QUADRANTS,
} from "@/lib/memo-quadrant";
import { effectiveStickyPosition, nextStickyColor } from "@/lib/memo-sticky";

type NoteState = StickyNoteData & { x: number; y: number };

export function StickyNoteBoard() {
  const [notes, setNotes] = useState<NoteState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignNoteId, setAssignNoteId] = useState<string | null>(null);
  const maxZRef = useRef(1);
  const boardRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/memos?standaloneOnly=true");
    const data = await res.json();
    const memos: StickyNoteData[] = data.memos ?? [];
    maxZRef.current = Math.max(1, ...memos.map((m) => m.zIndex ?? 1));
    setNotes(
      memos.map((memo, index) => {
        const pos = effectiveStickyPosition(memo.posX, memo.posY, index);
        return { ...memo, x: pos.x, y: pos.y };
      }),
    );
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

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

  async function persistNote(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/memos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "保存失败");
  }

  function noteSize(note: NoteState) {
    return {
      width: note.width ?? DEFAULT_STICKY_WIDTH,
      height: note.height ?? DEFAULT_STICKY_HEIGHT,
    };
  }

  function handleMove(id: string, x: number, y: number) {
    patchNote(id, { x, y });
  }

  function handleMoveEnd(id: string, x: number, y: number) {
    const note = notes.find((n) => n.id === id);
    const { width, height } = note ? noteSize(note) : { width: DEFAULT_STICKY_WIDTH, height: DEFAULT_STICKY_HEIGHT };
    const quadrant = detectMemoQuadrant(x, y, width, height);
    patchNote(id, { x, y, posX: x, posY: y, quadrant });
    void persistNote(id, { posX: x, posY: y, quadrant }).catch((e) =>
      setError(e instanceof Error ? e.message : "保存位置失败"),
    );
  }

  function handleResize(id: string, width: number, height: number) {
    patchNote(id, { width, height });
  }

  function handleResizeEnd(id: string, width: number, height: number) {
    const note = notes.find((n) => n.id === id);
    const x = note?.x ?? 0;
    const y = note?.y ?? 0;
    const quadrant = detectMemoQuadrant(x, y, width, height);
    patchNote(id, { width, height, quadrant });
    void persistNote(id, { width, height, quadrant }).catch((e) =>
      setError(e instanceof Error ? e.message : "保存大小失败"),
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
    if (patch.color) patchNote(id, { color: patch.color });
    if (patch.quadrant !== undefined) patchNote(id, { quadrant: patch.quadrant });
    try {
      await persistNote(id, patch);
      if (patch.content !== undefined) {
        setEditingId(null);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这张便签？")) return;
    try {
      const res = await fetch(`/api/memos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "删除失败");
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }

  async function handleAdd() {
    setError("");
    const board = boardRef.current;
    const scrollLeft = board?.scrollLeft ?? 0;
    const scrollTop = board?.scrollTop ?? 0;
    const viewW = board?.clientWidth ?? MEMO_QUADRANT_BOARD_WIDTH;
    const viewH = board?.clientHeight ?? MEMO_QUADRANT_BOARD_HEIGHT;
    const posX = scrollLeft + Math.max(40, (viewW - DEFAULT_STICKY_WIDTH) / 2);
    const posY = scrollTop + Math.max(40, (viewH - DEFAULT_STICKY_HEIGHT) / 2);
    const quadrant = detectMemoQuadrant(posX, posY, DEFAULT_STICKY_WIDTH, DEFAULT_STICKY_HEIGHT);

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
      if (!res.ok) throw new Error(data.error ?? "创建失败");
      await load();
      if (data.memo?.id) {
        setActiveId(data.memo.id);
        setEditingId(data.memo.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    }
  }

  async function handleAssignSubmit(data: {
    parentPlanId: string | null;
    startDate: string;
    endDate: string | null;
  }) {
    if (!assignNoteId) return;
    const res = await fetch(`/api/memos/${assignNoteId}/assign-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "分配失败");
    setNotes((prev) => prev.filter((n) => n.id !== assignNoteId));
    setAssignNoteId(null);
    if (activeId === assignNoteId) setActiveId(null);
  }

  const assignNote = assignNoteId ? notes.find((n) => n.id === assignNoteId) : null;

  if (loading) return <Loading label="加载便签…" />;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => void handleAdd()}>
          + 新建便签
        </Button>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索便签…"
          className="min-w-[160px] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <span className="text-xs text-gray-400">{notes.length} 张便签</span>
      </div>

      {error && <ErrorMessage message={error} />}

      <div
        ref={boardRef}
        className="relative flex-1 overflow-auto rounded-xl border border-gray-300 bg-[#f5f0e8] dark:border-gray-600 dark:bg-[#2a2824]"
        onPointerDown={() => {
          setActiveId(null);
          setEditingId(null);
        }}
      >
        <div
          className="relative"
          style={{
            width: MEMO_QUADRANT_BOARD_WIDTH,
            height: MEMO_QUADRANT_BOARD_HEIGHT,
            minWidth: MEMO_QUADRANT_BOARD_WIDTH,
            minHeight: MEMO_QUADRANT_BOARD_HEIGHT,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2"
            aria-hidden
          >
            {MEMO_QUADRANTS.map((q) => (
              <div
                key={q.id}
                className="flex flex-col border border-dashed border-black/10 p-3 dark:border-white/10"
              >
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {q.shortLabel} · {q.label}
                </span>
                <span className="mt-0.5 text-[10px] text-gray-400">{q.hint}</span>
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black/15 dark:bg-white/15" />
          <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-black/15 dark:bg-white/15" />

          {filteredNotes.length === 0 && !search.trim() && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-sm text-gray-500">
              <p className="mb-1">拖动便签到对应象限进行分类</p>
              <p className="text-xs opacity-70">左=紧急 · 右=不紧急 · 上=重要 · 下=不重要</p>
            </div>
          )}

          {filteredNotes.length === 0 && search.trim() && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-500">
              没有匹配的便签
            </div>
          )}

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

      <StickyNoteAssignModal
        key={assignNoteId ?? "closed"}
        open={Boolean(assignNote)}
        noteTitle={assignNote?.title ?? "便签"}
        onClose={() => setAssignNoteId(null)}
        onSubmit={handleAssignSubmit}
      />
    </div>
  );
}
