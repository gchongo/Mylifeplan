"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MemoMarkdown } from "@/components/memos/memo-markdown";
import { memoDisplayBody } from "@/lib/memo-content";
import {
  DEFAULT_STICKY_HEIGHT,
  DEFAULT_STICKY_WIDTH,
  MEMO_QUADRANTS,
  MIN_STICKY_HEIGHT,
  MIN_STICKY_WIDTH,
  type MemoQuadrantId,
} from "@/lib/memo-quadrant";
import {
  STICKY_NOTE_COLORS,
  stickyNoteColor,
  type StickyNoteColorId,
} from "@/lib/memo-sticky";
import { cn } from "@/lib/utils";

export interface StickyNoteData {
  id: string;
  title: string;
  description: string | null;
  body: string | null;
  posX: number | null;
  posY: number | null;
  zIndex: number;
  color: string;
  quadrant?: string | null;
  width?: number | null;
  height?: number | null;
  updatedAt: string;
}

interface StickyNoteProps {
  note: StickyNoteData;
  x: number;
  y: number;
  isActive: boolean;
  startInEditMode?: boolean;
  onActivate: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onMoveEnd: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onResizeEnd: (id: string, width: number, height: number) => void;
  onUpdate: (id: string, patch: Partial<StickyNoteData & { content: string }>) => void;
  onDelete: (id: string) => void;
  onAssign?: (id: string) => void;
}

export function StickyNote({
  note,
  x,
  y,
  isActive,
  startInEditMode = false,
  onActivate,
  onMove,
  onMoveEnd,
  onResize,
  onResizeEnd,
  onUpdate,
  onDelete,
  onAssign,
}: StickyNoteProps) {
  const palette = stickyNoteColor(note.color);
  const width = note.width ?? DEFAULT_STICKY_WIDTH;
  const height = note.height ?? DEFAULT_STICKY_HEIGHT;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [showColors, setShowColors] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null,
  );
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);
  const autoEditStarted = useRef(false);

  const displayBody = memoDisplayBody(note);
  const quadrantMeta = MEMO_QUADRANTS.find((q) => q.id === note.quadrant);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const startEdit = useCallback(() => {
    setDraft(displayBody);
    setEditing(true);
    onActivate();
  }, [displayBody, onActivate]);

  useEffect(() => {
    autoEditStarted.current = false;
  }, [note.id]);

  useEffect(() => {
    if (startInEditMode && !editing && !autoEditStarted.current) {
      autoEditStarted.current = true;
      startEdit();
    }
  }, [startInEditMode, editing, startEdit]);

  const saveEdit = useCallback(() => {
    const text = draft.trim();
    setEditing(false);
    if (text !== displayBody) {
      onUpdate(note.id, { content: text });
    }
  }, [draft, displayBody, note.id, onUpdate]);

  function onPointerDown(e: React.PointerEvent) {
    if (editing) return;
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    onActivate();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: x, origY: y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const nx = drag.origX + (e.clientX - drag.startX);
    const ny = drag.origY + (e.clientY - drag.startY);
    onMove(note.id, Math.max(0, nx), Math.max(0, ny));
  }

  function onPointerUp(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    const nx = drag.origX + (e.clientX - drag.startX);
    const ny = drag.origY + (e.clientY - drag.startY);
    onMoveEnd(note.id, Math.max(0, nx), Math.max(0, ny));
  }

  function onResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    onActivate();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: width,
      origH: height,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onResizePointerMove(e: React.PointerEvent) {
    const resize = resizeRef.current;
    if (!resize) return;
    const nextW = Math.max(MIN_STICKY_WIDTH, resize.origW + (e.clientX - resize.startX));
    const nextH = Math.max(MIN_STICKY_HEIGHT, resize.origH + (e.clientY - resize.startY));
    onResize(note.id, nextW, nextH);
  }

  function onResizePointerUp(e: React.PointerEvent) {
    const resize = resizeRef.current;
    if (!resize) return;
    resizeRef.current = null;
    const nextW = Math.max(MIN_STICKY_WIDTH, resize.origW + (e.clientX - resize.startX));
    const nextH = Math.max(MIN_STICKY_HEIGHT, resize.origH + (e.clientY - resize.startY));
    onResizeEnd(note.id, nextW, nextH);
  }

  return (
    <div
      ref={noteRef}
      className={cn(
        "absolute flex flex-col rounded-sm shadow-md transition-shadow",
        isActive && "shadow-lg ring-2 ring-black/10",
      )}
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex: note.zIndex,
        backgroundColor: palette.bg,
        borderTop: `3px solid ${palette.border}`,
        color: palette.text,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onActivate();
      }}
    >
      <div
        className="flex cursor-grab items-center justify-between gap-1 px-2 py-1.5 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="min-w-0">
          <span className="text-[10px] opacity-60">
            {new Date(note.updatedAt).toLocaleDateString("zh-CN", {
              month: "numeric",
              day: "numeric",
            })}
          </span>
          {quadrantMeta && (
            <span className="ml-1.5 text-[10px] font-medium opacity-70">{quadrantMeta.shortLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-0.5" data-no-drag>
          <select
            value={note.quadrant ?? ""}
            onChange={(e) =>
              onUpdate(note.id, {
                quadrant: (e.target.value || null) as MemoQuadrantId | null,
              })
            }
            className="w-9 shrink-0 rounded border border-black/10 bg-white/60 px-0.5 py-0.5 text-center text-[10px] outline-none"
            title="四象限分类"
            aria-label="四象限分类"
          >
            <option value="">—</option>
            {MEMO_QUADRANTS.map((q) => (
              <option key={q.id} value={q.id} title={`${q.label} · ${q.hint}`}>
                {q.shortLabel}
              </option>
            ))}
          </select>
          {onAssign && (
            <button
              type="button"
              className="rounded p-1 opacity-60 hover:bg-black/5 hover:opacity-100"
              title="分配到计划"
              aria-label="分配到计划"
              onClick={() => onAssign(note.id)}
            >
              <AssignIcon />
            </button>
          )}
          <button
            type="button"
            className="rounded p-1 opacity-60 hover:bg-black/5 hover:opacity-100"
            title="换颜色"
            aria-label="换颜色"
            onClick={() => setShowColors((v) => !v)}
          >
            <ColorDotIcon />
          </button>
          <button
            type="button"
            className="rounded p-1 opacity-60 hover:bg-black/5 hover:opacity-100"
            title="删除"
            aria-label="删除"
            onClick={() => onDelete(note.id)}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {showColors && (
        <div className="flex flex-wrap gap-1.5 px-2 pb-2" data-no-drag>
          {STICKY_NOTE_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.label}
              aria-label={c.label}
              className={cn(
                "h-5 w-5 rounded-full border-2",
                note.color === c.id ? "border-gray-800" : "border-transparent",
              )}
              style={{ backgroundColor: c.bg }}
              onClick={() => {
                onUpdate(note.id, { color: c.id as StickyNoteColorId });
                setShowColors(false);
              }}
            />
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3" data-no-drag>
        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setEditing(false);
              }
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                saveEdit();
              }
            }}
            placeholder="写点什么…（支持 Markdown）"
            className="h-full w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:opacity-50"
            style={{ color: palette.text }}
          />
        ) : (
          <button
            type="button"
            className="h-full w-full overflow-y-auto text-left text-sm leading-relaxed"
            onClick={startEdit}
            onDoubleClick={startEdit}
          >
            {displayBody.trim() ? (
              <MemoMarkdown content={displayBody} className="[&_*]:!text-inherit" />
            ) : (
              <span className="opacity-50">点击输入…</span>
            )}
          </button>
        )}
      </div>

      <div
        data-no-drag
        className="absolute bottom-0 right-0 flex h-4 w-4 cursor-se-resize items-end justify-end p-0.5 opacity-40 hover:opacity-80"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
        aria-hidden
      >
        <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="currentColor">
          <path d="M9 1v8H1" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}

function AssignIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ColorDotIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <circle cx="12" cy="15" r="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
