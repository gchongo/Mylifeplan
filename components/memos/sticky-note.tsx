"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MemoMarkdown } from "@/components/memos/memo-markdown";
import { memoDisplayBody } from "@/lib/memo-content";
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
  updatedAt: string;
}

interface StickyNoteProps {
  note: StickyNoteData;
  index: number;
  x: number;
  y: number;
  isActive: boolean;
  onActivate: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onMoveEnd: (id: string, x: number, y: number) => void;
  onUpdate: (id: string, patch: Partial<StickyNoteData & { content: string }>) => void;
  onDelete: (id: string) => void;
}

export function StickyNote({
  note,
  x,
  y,
  isActive,
  onActivate,
  onMove,
  onMoveEnd,
  onUpdate,
  onDelete,
}: StickyNoteProps) {
  const palette = stickyNoteColor(note.color);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [showColors, setShowColors] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null,
  );

  const displayBody = memoDisplayBody(note);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const startEdit = useCallback(() => {
    setDraft(displayBody);
    setEditing(true);
    onActivate();
  }, [displayBody, onActivate]);

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

  return (
    <div
      ref={noteRef}
      className={cn(
        "absolute flex w-[240px] flex-col rounded-sm shadow-md transition-shadow",
        isActive && "shadow-lg ring-2 ring-black/10",
      )}
      style={{
        left: x,
        top: y,
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
        className="flex cursor-grab items-center justify-between px-2 py-1.5 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="text-[10px] opacity-60">
          {new Date(note.updatedAt).toLocaleDateString("zh-CN", {
            month: "numeric",
            day: "numeric",
          })}
        </span>
        <div className="flex items-center gap-0.5" data-no-drag>
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

      <div className="min-h-[120px] flex-1 px-3 pb-3" data-no-drag>
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
            className="h-full min-h-[100px] w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:opacity-50"
            style={{ color: palette.text }}
          />
        ) : (
          <button
            type="button"
            className="w-full text-left text-sm leading-relaxed"
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
    </div>
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
