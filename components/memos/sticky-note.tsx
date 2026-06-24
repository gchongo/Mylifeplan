"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MemoMarkdown } from "@/components/memos/memo-markdown";
import { localizeMemoQuadrantOption } from "@/lib/i18n/feed-helpers";
import { localizeStickyColorLabel } from "@/lib/i18n/memo-helpers";
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
  onMoveEnd: (id: string, x: number, y: number) => void;
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
  onMoveEnd,
  onResizeEnd,
  onUpdate,
  onDelete,
  onAssign,
}: StickyNoteProps) {
  const { t, locale } = useI18n();
  const palette = stickyNoteColor(note.color);
  const width = note.width ?? DEFAULT_STICKY_WIDTH;
  const height = note.height ?? DEFAULT_STICKY_HEIGHT;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [showColors, setShowColors] = useState(false);
  const [dragDelta, setDragDelta] = useState<{ dx: number; dy: number } | null>(null);
  const [resizeSize, setResizeSize] = useState<{ width: number; height: number } | null>(null);
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
  const dragFrameRef = useRef<number | null>(null);
  const pendingDragDeltaRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const pendingResizeRef = useRef<{ width: number; height: number } | null>(null);

  const displayBody = memoDisplayBody(note);
  const quadrantMeta = note.quadrant
    ? localizeMemoQuadrantOption(t, note.quadrant as MemoQuadrantId)
    : null;
  const displayWidth = resizeSize?.width ?? width;
  const displayHeight = resizeSize?.height ?? height;
  const isDragging = dragDelta !== null;
  const isResizing = resizeSize !== null;

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
    setDragDelta({ dx: 0, dy: 0 });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    pendingDragDeltaRef.current = {
      dx: e.clientX - drag.startX,
      dy: e.clientY - drag.startY,
    };
    if (dragFrameRef.current != null) return;
    dragFrameRef.current = requestAnimationFrame(() => {
      dragFrameRef.current = null;
      if (pendingDragDeltaRef.current) {
        setDragDelta(pendingDragDeltaRef.current);
      }
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (dragFrameRef.current != null) {
      cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
    pendingDragDeltaRef.current = null;
    setDragDelta(null);
    const nx = Math.max(0, drag.origX + (e.clientX - drag.startX));
    const ny = Math.max(0, drag.origY + (e.clientY - drag.startY));
    onMoveEnd(note.id, nx, ny);
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
    setResizeSize({ width, height });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onResizePointerMove(e: React.PointerEvent) {
    const resize = resizeRef.current;
    if (!resize) return;
    pendingResizeRef.current = {
      width: Math.max(MIN_STICKY_WIDTH, resize.origW + (e.clientX - resize.startX)),
      height: Math.max(MIN_STICKY_HEIGHT, resize.origH + (e.clientY - resize.startY)),
    };
    if (resizeFrameRef.current != null) return;
    resizeFrameRef.current = requestAnimationFrame(() => {
      resizeFrameRef.current = null;
      if (pendingResizeRef.current) {
        setResizeSize(pendingResizeRef.current);
      }
    });
  }

  function onResizePointerUp(e: React.PointerEvent) {
    const resize = resizeRef.current;
    if (!resize) return;
    resizeRef.current = null;
    if (resizeFrameRef.current != null) {
      cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = null;
    }
    pendingResizeRef.current = null;
    const nextW = Math.max(MIN_STICKY_WIDTH, resize.origW + (e.clientX - resize.startX));
    const nextH = Math.max(MIN_STICKY_HEIGHT, resize.origH + (e.clientY - resize.startY));
    setResizeSize(null);
    onResizeEnd(note.id, nextW, nextH);
  }

  return (
    <div
      ref={noteRef}
      className={cn(
        "absolute flex flex-col rounded-sm shadow-md",
        isActive && "shadow-lg ring-2 ring-black/10",
      )}
      style={{
        left: x,
        top: y,
        width: displayWidth,
        height: displayHeight,
        zIndex: note.zIndex,
        backgroundColor: palette.bg,
        borderTop: `3px solid ${palette.border}`,
        color: palette.text,
        transform: dragDelta ? `translate3d(${dragDelta.dx}px, ${dragDelta.dy}px, 0)` : undefined,
        willChange: dragDelta ? "transform" : undefined,
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
            {new Date(note.updatedAt).toLocaleDateString(locale === "en-US" ? "en-US" : "zh-CN", {
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
            title={t("memos.note.quadrant")}
            aria-label={t("memos.note.quadrant")}
          >
            <option value="">—</option>
            {MEMO_QUADRANTS.map((q) => {
              const option = localizeMemoQuadrantOption(t, q.id);
              return (
                <option key={q.id} value={q.id} title={`${option.shortLabel} ${option.label}`}>
                  {option.shortLabel}
                </option>
              );
            })}
          </select>
          {onAssign && (
            <button
              type="button"
              className="rounded p-1 opacity-60 hover:bg-black/5 hover:opacity-100"
              title={t("memos.note.assignPlan")}
              aria-label={t("memos.note.assignPlan")}
              onClick={() => onAssign(note.id)}
            >
              <AssignIcon />
            </button>
          )}
          <button
            type="button"
            className="rounded p-1 opacity-60 hover:bg-black/5 hover:opacity-100"
            title={t("memos.note.changeColor")}
            aria-label={t("memos.note.changeColor")}
            onClick={() => setShowColors((v) => !v)}
          >
            <ColorDotIcon />
          </button>
          <button
            type="button"
            className="rounded p-1 opacity-60 hover:bg-black/5 hover:opacity-100"
            title={t("memos.note.delete")}
            aria-label={t("memos.note.delete")}
            onClick={() => onDelete(note.id)}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {showColors && (
        <div className="flex flex-wrap gap-1.5 px-2 pb-2" data-no-drag>
          {STICKY_NOTE_COLORS.map((c) => {
            const colorLabel = localizeStickyColorLabel(t, c.id);
            return (
              <button
                key={c.id}
                type="button"
                title={colorLabel}
                aria-label={colorLabel}
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
            );
          })}
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
            placeholder={t("memos.note.placeholder")}
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
              <span className="opacity-50">{t("memos.note.clickToEdit")}</span>
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
