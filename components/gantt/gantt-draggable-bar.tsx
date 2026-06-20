"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getEffectiveEndDate } from "@/lib/content-router";
import {
  addDaysUtc,
  daysBetween,
  pixelDeltaToDays,
  type TimelineLayout,
} from "@/lib/gantt-scale";
import type { GanttItem } from "@/types";
import { cn } from "@/lib/utils";

type DragMode = "move" | "resize-start" | "resize-end";

interface DragState {
  mode: DragMode;
  startX: number;
  origStart: string;
  origEnd: string;
  hadDueDate: boolean;
}

export function GanttDraggableBar({
  item,
  layout,
  left,
  width,
  barShell,
  barText,
  onUpdated,
  onTaskClick,
}: {
  item: GanttItem;
  layout: TimelineLayout;
  left: number;
  width: number;
  barShell: string;
  barText: string;
  onUpdated: (updated: GanttItem) => void;
  onTaskClick?: () => void;
}) {
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<{ start: string; end: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  const applyDrag = useCallback(
    (state: DragState, clientX: number) => {
      const deltaDays = pixelDeltaToDays(clientX - state.startX, layout);
      if (deltaDays === 0 && state.mode === "move") {
        setPreview(null);
        return;
      }

      if (state.mode === "move") {
        const duration = daysBetween(state.origStart, state.origEnd);
        let newStart = addDaysUtc(state.origStart, deltaDays);
        let newEnd = addDaysUtc(newStart, duration);
        setPreview({ start: newStart, end: newEnd });
        return;
      }

      if (state.mode === "resize-start") {
        let newStart = addDaysUtc(state.origStart, deltaDays);
        if (newStart > state.origEnd) newStart = state.origEnd;
        setPreview({ start: newStart, end: state.origEnd });
        return;
      }

      let newEnd = addDaysUtc(state.origEnd, deltaDays);
      if (newEnd < state.origStart) newEnd = state.origStart;
      setPreview({ start: state.origStart, end: newEnd });
    },
    [layout],
  );

  const commitDrag = useCallback(
    async (state: DragState, clientX: number) => {
      const deltaDays = pixelDeltaToDays(clientX - state.startX, layout);
      if (deltaDays === 0 && state.mode === "move") return;

      let startDate = state.origStart;
      let dueDate: string | null = state.hadDueDate ? state.origEnd : null;

      if (state.mode === "move") {
        const duration = daysBetween(state.origStart, state.origEnd);
        startDate = addDaysUtc(state.origStart, deltaDays);
        const newEnd = addDaysUtc(startDate, duration);
        if (state.hadDueDate) dueDate = newEnd;
      } else if (state.mode === "resize-start") {
        startDate = addDaysUtc(state.origStart, deltaDays);
        if (startDate > state.origEnd) startDate = state.origEnd;
      } else {
        const newEnd = addDaysUtc(state.origEnd, deltaDays);
        dueDate = newEnd >= state.origStart ? newEnd : state.origStart;
      }

      if (startDate === item.startDate && dueDate === (item.dueDate ?? null)) return;

      setSaving(true);
      try {
        const body: { startDate: string; dueDate?: string | null } = { startDate };
        if (state.hadDueDate || state.mode === "resize-end") {
          body.dueDate = dueDate;
        }

        const res = await fetch(`/api/tasks/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) return;

        const task = data.task;
        const { effectiveEnd, isVirtualEnd } = getEffectiveEndDate({
          startDate: task.startDate,
          dueDate: task.dueDate,
        });
        onUpdated({
          ...item,
          startDate: task.startDate,
          dueDate: task.dueDate,
          effectiveEnd: effectiveEnd ?? task.startDate,
          isVirtualEnd,
        });
      } finally {
        setSaving(false);
      }
    },
    [item, layout, onUpdated],
  );

  useEffect(() => {
    if (!dragging) return;

    function onMove(e: MouseEvent) {
      const state = dragRef.current;
      if (!state) return;
      applyDrag(state, e.clientX);
    }

    function onUp(e: MouseEvent) {
      const state = dragRef.current;
      if (state) {
        const moved = Math.abs(e.clientX - state.startX) > 3;
        if (!moved && state.mode === "move") {
          onTaskClick?.();
        } else {
          void commitDrag(state, e.clientX);
        }
      }
      dragRef.current = null;
      setDragging(null);
      setPreview(null);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, applyDrag, commitDrag, onTaskClick]);

  function startDrag(e: React.MouseEvent, mode: DragMode) {
    e.preventDefault();
    e.stopPropagation();
    const state: DragState = {
      mode,
      startX: e.clientX,
      origStart: item.startDate,
      origEnd: item.effectiveEnd,
      hadDueDate: Boolean(item.dueDate),
    };
    dragRef.current = state;
    setDragging(state);
  }

  const metrics =
    preview && dragging
      ? (() => {
          const fromMs = new Date(layout.from + "T00:00:00.000Z").getTime();
          const toMs = new Date(layout.to + "T00:00:00.000Z").getTime() + 86400000;
          const span = toMs - fromMs;
          const startMs = new Date(preview.start + "T00:00:00.000Z").getTime();
          const endMs = new Date(preview.end + "T00:00:00.000Z").getTime();
          const dayFraction = layout.totalWidth / (daysBetween(layout.from, layout.to) + 1);
          return {
            left: ((startMs - fromMs) / span) * layout.totalWidth,
            width: Math.max(
              dayFraction * 0.6,
              ((endMs - startMs) / span) * layout.totalWidth + dayFraction,
            ),
          };
        })()
      : { left, width };

  return (
    <div
      data-gantt-bar
      className="absolute top-1/2 -translate-y-1/2"
      style={{ left: metrics.left, width: Math.max(metrics.width, 8) }}
    >
      <div
        className={cn(
          "group relative h-7 overflow-hidden rounded-md",
          barShell,
          saving && "opacity-60",
          dragging && "ring-2 ring-brand-400 ring-offset-1",
        )}
      >
        <div
          className="absolute left-0 top-0 z-10 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
          onMouseDown={(e) => startDrag(e, "resize-start")}
        />
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => startDrag(e, "move")}
        >
          <span
            className={cn(
              "pointer-events-none block truncate px-2 text-xs leading-7",
              barText,
            )}
          >
            {item.title}
          </span>
        </div>
        <div
          className="absolute right-0 top-0 z-10 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
          onMouseDown={(e) => startDrag(e, "resize-end")}
        />
      </div>
      {item.isVirtualEnd && !preview && (
        <div
          className="absolute top-1/2 h-0.5 w-12 -translate-y-1/2 bg-amber-400"
          style={{ left: "100%" }}
        >
          <span className="absolute -right-0.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-400" />
        </div>
      )}
    </div>
  );
}
