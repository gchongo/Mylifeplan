"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage, Loading } from "@/components/ui/feedback";
import { StickyNote, type StickyNoteData } from "@/components/memos/sticky-note";
import { StickyNoteAssignModal } from "@/components/memos/sticky-note-assign-modal";
import { effectiveStickyPosition, nextStickyColor } from "@/lib/memo-sticky";

type NoteState = StickyNoteData & { x: number; y: number };

export function StickyNoteBoard() {
  const [notes, setNotes] = useState<NoteState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
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

  const boardSize = useMemo(() => {
    if (notes.length === 0) return { width: "100%", height: "100%" };
    const maxX = Math.max(...notes.map((n) => n.x + 280), 800);
    const maxY = Math.max(...notes.map((n) => n.y + 260), 600);
    return { width: maxX, height: maxY };
  }, [notes]);

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

  function handleMove(id: string, x: number, y: number) {
    patchNote(id, { x, y });
  }

  function handleMoveEnd(id: string, x: number, y: number) {
    patchNote(id, { x, y, posX: x, posY: y });
    void persistNote(id, { posX: x, posY: y }).catch((e) =>
      setError(e instanceof Error ? e.message : "保存位置失败"),
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
    try {
      await persistNote(id, patch);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }

  async function handleAdd() {
    setError("");
    const board = boardRef.current;
    const scrollLeft = board?.scrollLeft ?? 0;
    const scrollTop = board?.scrollTop ?? 0;
    const viewW = board?.clientWidth ?? 800;
    const viewH = board?.clientHeight ?? 600;
    const posX = scrollLeft + Math.max(40, (viewW - 240) / 2);
    const posY = scrollTop + Math.max(40, (viewH - 180) / 2);

    try {
      const res = await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empty: true,
          color: nextStickyColor(notes.length),
          posX,
          posY,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "创建失败");
      await load();
      if (data.memo?.id) setActiveId(data.memo.id);
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
        className="relative flex-1 overflow-auto rounded-xl border border-dashed border-gray-300 bg-[#f5f0e8] dark:border-gray-600 dark:bg-[#2a2824]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        onPointerDown={() => setActiveId(null)}
      >
        <div
          className="relative"
          style={{ minWidth: boardSize.width, minHeight: boardSize.height }}
        >
          {filteredNotes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-sm text-gray-500">
              {search.trim() ? (
                <p>没有匹配的便签</p>
              ) : (
                <>
                  <p className="mb-3">板上还没有便签</p>
                  <Button type="button" size="sm" variant="secondary" onClick={() => void handleAdd()}>
                    贴第一张便签
                  </Button>
                </>
              )}
            </div>
          )}
          {filteredNotes.map((note, index) => (
            <StickyNote
              key={note.id}
              note={note}
              index={index}
              x={note.x}
              y={note.y}
              isActive={activeId === note.id}
              onActivate={() => handleActivate(note.id)}
              onMove={handleMove}
              onMoveEnd={handleMoveEnd}
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
