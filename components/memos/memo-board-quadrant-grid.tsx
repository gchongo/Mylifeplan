"use client";

import { useRef } from "react";
import {
  clampMemoAxisRatio,
  MEMO_QUADRANTS,
  resolveMemoBoardAxisPixels,
  type MemoBoardAxis,
} from "@/lib/memo-quadrant";
import { cn } from "@/lib/utils";

function AxisIconImportant({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}

function AxisIconNotImportant({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M8 12h8" />
    </svg>
  );
}

function AxisIconUrgent({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

function AxisIconNotUrgent({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M12 8v4l2.5 2.5" />
    </svg>
  );
}

export function MemoBoardAxisEdgeIcons() {
  const iconClass = "h-4 w-4 text-gray-500/80 dark:text-gray-400/80";
  return (
    <>
      <span
        className="pointer-events-none absolute left-1/2 top-1.5 z-20 -translate-x-1/2"
        title="重要"
        aria-label="重要"
      >
        <AxisIconImportant className={iconClass} />
      </span>
      <span
        className="pointer-events-none absolute bottom-1.5 left-1/2 z-20 -translate-x-1/2"
        title="不重要"
        aria-label="不重要"
      >
        <AxisIconNotImportant className={iconClass} />
      </span>
      <span
        className="pointer-events-none absolute left-2 top-1/2 z-20 -translate-y-1/2"
        title="不紧急"
        aria-label="不紧急"
      >
        <AxisIconNotUrgent className={iconClass} />
      </span>
      <span
        className="pointer-events-none absolute right-2 top-1/2 z-20 -translate-y-1/2"
        title="紧急"
        aria-label="紧急"
      >
        <AxisIconUrgent className={iconClass} />
      </span>
    </>
  );
}

export function MemoBoardQuadrantGrid({
  boardWidth,
  boardHeight,
  axis,
  onAxisChange,
  onAxisCommit,
}: {
  boardWidth: number;
  boardHeight: number;
  axis: MemoBoardAxis;
  onAxisChange: (axis: MemoBoardAxis) => void;
  onAxisCommit: (axis: MemoBoardAxis) => void;
}) {
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origXRatio: number;
    origYRatio: number;
  } | null>(null);

  const { axisX, axisY } = resolveMemoBoardAxisPixels(boardWidth, boardHeight, axis);

  function onHandlePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origXRatio: axis.axisXRatio,
      origYRatio: axis.axisYRatio,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const nextX = clampMemoAxisRatio(drag.origXRatio + (e.clientX - drag.startX) / boardWidth);
    const nextY = clampMemoAxisRatio(drag.origYRatio + (e.clientY - drag.startY) / boardHeight);
    onAxisChange({ axisXRatio: nextX, axisYRatio: nextY });
  }

  function onHandlePointerUp(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    const nextX = clampMemoAxisRatio(drag.origXRatio + (e.clientX - drag.startX) / boardWidth);
    const nextY = clampMemoAxisRatio(drag.origYRatio + (e.clientY - drag.startY) / boardHeight);
    const next = { axisXRatio: nextX, axisYRatio: nextY };
    onAxisChange(next);
    onAxisCommit(next);
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
      {MEMO_QUADRANTS.map((q) => {
        const bounds = (() => {
          switch (q.id) {
            case "urgent_important":
              return { left: axisX, top: 0, width: boardWidth - axisX, height: axisY };
            case "not_urgent_important":
              return { left: 0, top: 0, width: axisX, height: axisY };
            case "urgent_not_important":
              return { left: axisX, top: axisY, width: boardWidth - axisX, height: boardHeight - axisY };
            default:
              return { left: 0, top: axisY, width: axisX, height: boardHeight - axisY };
          }
        })();
        return (
          <div
            key={q.id}
            className="absolute border border-dashed border-black/10 dark:border-white/10"
            style={{
              left: bounds.left,
              top: bounds.top,
              width: bounds.width,
              height: bounds.height,
            }}
          >
            <span className="inline-flex p-1.5 text-[10px] font-bold text-gray-500/70 dark:text-gray-400/70">
              {q.shortLabel}
            </span>
          </div>
        );
      })}

      <div
        className="absolute top-0 w-px bg-black/20 dark:bg-white/20"
        style={{ left: axisX, height: boardHeight }}
      />
      <div
        className="absolute left-0 h-px bg-black/20 dark:bg-white/20"
        style={{ top: axisY, width: boardWidth }}
      />

      <button
        type="button"
        className={cn(
          "pointer-events-auto absolute z-[6] flex h-7 w-7 -translate-x-1/2 -translate-y-1/2",
          "cursor-move items-center justify-center rounded-full border border-black/15 bg-white/90 shadow-sm",
          "text-gray-600 hover:bg-white hover:shadow dark:border-white/20 dark:bg-gray-900/90 dark:text-gray-300",
        )}
        style={{ left: axisX, top: axisY }}
        title="拖动调整象限大小"
        aria-label="拖动调整象限大小"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M12 3v18M3 12h18" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </div>
  );
}
