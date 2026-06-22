"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getEffectiveEndDate } from "@/lib/content-router";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import {
  addDaysUtc,
  barMetricsFromDates,
  daysBetween,
  pixelDeltaToDays,
  type TimelineLayout,
} from "@/lib/gantt-scale";
import {
  constrainPlanMoveByMs,
  pixelDeltaToTimelineMs,
  planSpanMs,
  shiftPlanDateTime,
  timelineUsesMinutePrecision,
} from "@/lib/gantt-plan-drag";
import {
  constrainPlanMove,
  constrainPlanResizeEnd,
  constrainPlanResizeStart,
  type PlanDragConstraints,
} from "@/lib/gantt-plan-bind";
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
  barShellStyle,
  barText,
  barTextStyle,
  barHeightPx = 28,
  statusDotClass,
  showTitle = false,
  isSelected = false,
  onUpdated,
  onTaskClick,
  hitRowHeight,
  minStartDate,
  minContributionDate,
  maxContributionDate,
  previewOverride,
  onPreviewDates,
  onDragEnd,
  shellWidth,
}: {
  item: GanttItem;
  layout: TimelineLayout;
  left: number;
  width: number;
  barShell: string;
  barShellStyle?: CSSProperties;
  barText: string;
  barTextStyle?: CSSProperties;
  barHeightPx?: number;
  statusDotClass: string;
  showTitle?: boolean;
  isSelected?: boolean;
  onUpdated: (updated: GanttItem) => void;
  onTaskClick?: () => void;
  hitRowHeight?: number;
  minStartDate?: string;
  minContributionDate?: string;
  maxContributionDate?: string;
  previewOverride?: { start: string; end: string } | null;
  onPreviewDates?: (planId: string, preview: { start: string; end: string } | null) => void;
  onDragEnd?: () => void;
  /** 可见条宽度；未设时与 width 相同 */
  shellWidth?: number;
}) {
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<{ start: string; end: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  const dragConstraints = useMemo<PlanDragConstraints>(
    () => ({
      minStartDate,
      minContributionDate,
      maxContributionDate,
    }),
    [minStartDate, minContributionDate, maxContributionDate],
  );

  const applyDrag = useCallback(
    (state: DragState, clientX: number) => {
      const minutePrecision = timelineUsesMinutePrecision(layout);
      const deltaMs = pixelDeltaToTimelineMs(clientX - state.startX, layout);
      if (deltaMs === 0 && state.mode === "move") {
        setPreview(null);
        onPreviewDates?.(item.id, null);
        return;
      }

      if (state.mode === "move") {
        if (minutePrecision) {
          const durationMs = planSpanMs(state.origStart, state.origEnd);
          const rawStart = shiftPlanDateTime(state.origStart, deltaMs);
          const { start, end } = constrainPlanMoveByMs(rawStart, durationMs, dragConstraints);
          setPreview({ start, end });
          onPreviewDates?.(item.id, { start, end });
          return;
        }
        const deltaDays = pixelDeltaToDays(clientX - state.startX, layout);
        const duration = daysBetween(state.origStart, state.origEnd);
        const rawStart = addDaysUtc(state.origStart, deltaDays);
        const { start, end } = constrainPlanMove(rawStart, duration, dragConstraints);
        setPreview({ start, end });
        onPreviewDates?.(item.id, { start, end });
        return;
      }

      if (state.mode === "resize-start") {
        const rawStart = minutePrecision
          ? shiftPlanDateTime(state.origStart, deltaMs)
          : addDaysUtc(state.origStart, pixelDeltaToDays(clientX - state.startX, layout));
        const start = constrainPlanResizeStart(rawStart, state.origEnd, dragConstraints);
        setPreview({ start, end: state.origEnd });
        onPreviewDates?.(item.id, { start, end: state.origEnd });
        return;
      }

      const rawEnd = minutePrecision
        ? shiftPlanDateTime(state.origEnd, deltaMs)
        : addDaysUtc(state.origEnd, pixelDeltaToDays(clientX - state.startX, layout));
      const end = constrainPlanResizeEnd(state.origStart, rawEnd, maxContributionDate);
      setPreview({ start: state.origStart, end });
      onPreviewDates?.(item.id, { start: state.origStart, end });
    },
    [layout, item.id, onPreviewDates, dragConstraints, maxContributionDate],
  );

  const commitDrag = useCallback(
    async (state: DragState, clientX: number) => {
      const minutePrecision = timelineUsesMinutePrecision(layout);
      const deltaMs = pixelDeltaToTimelineMs(clientX - state.startX, layout);
      if (deltaMs === 0 && state.mode === "move") return;

      let startDate = state.origStart;
      let endDate: string | null = state.hadDueDate ? state.origEnd : null;

      if (state.mode === "move") {
        if (minutePrecision) {
          const durationMs = planSpanMs(state.origStart, state.origEnd);
          const moved = constrainPlanMoveByMs(
            shiftPlanDateTime(state.origStart, deltaMs),
            durationMs,
            dragConstraints,
          );
          startDate = moved.start;
          if (state.hadDueDate) endDate = moved.end;
        } else {
          const deltaDays = pixelDeltaToDays(clientX - state.startX, layout);
          const duration = daysBetween(state.origStart, state.origEnd);
          const moved = constrainPlanMove(
            addDaysUtc(state.origStart, deltaDays),
            duration,
            dragConstraints,
          );
          startDate = moved.start;
          if (state.hadDueDate) endDate = moved.end;
        }
      } else if (state.mode === "resize-start") {
        startDate = constrainPlanResizeStart(
          minutePrecision
            ? shiftPlanDateTime(state.origStart, deltaMs)
            : addDaysUtc(state.origStart, pixelDeltaToDays(clientX - state.startX, layout)),
          state.origEnd,
          dragConstraints,
        );
      } else {
        endDate = constrainPlanResizeEnd(
          state.origStart,
          minutePrecision
            ? shiftPlanDateTime(state.origEnd, deltaMs)
            : addDaysUtc(state.origEnd, pixelDeltaToDays(clientX - state.startX, layout)),
          maxContributionDate,
        );
      }

      if (startDate === item.startDate && endDate === (item.endDate ?? null)) return;

      setSaving(true);
      try {
        const body: { startDate: string; endDate?: string | null } = { startDate };
        if (state.hadDueDate || state.mode === "resize-end") {
          body.endDate = endDate;
        }

        const res = await fetch(`/api/plans/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) return;

        const plan = data.plan;
        const { effectiveEnd, isVirtualEnd } = getEffectiveEndDate({
          startDate: plan.startDate,
          dueDate: plan.endDate,
        });
        onUpdated({
          ...item,
          startDate: plan.startDate,
          endDate: plan.endDate,
          effectiveEnd: effectiveEnd ?? plan.startDate,
          isVirtualEnd,
        });
        dispatchPlanUpdated();
      } finally {
        setSaving(false);
      }
    },
    [item, layout, onUpdated, dragConstraints, maxContributionDate],
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
      onPreviewDates?.(item.id, null);
      onDragEnd?.();
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, applyDrag, commitDrag, onTaskClick, item.id, onPreviewDates, onDragEnd]);

  function startDrag(e: React.MouseEvent, mode: DragMode) {
    e.preventDefault();
    e.stopPropagation();
    const state: DragState = {
      mode,
      startX: e.clientX,
      origStart: item.startDate,
      origEnd: item.effectiveEnd,
      hadDueDate: Boolean(item.endDate),
    };
    dragRef.current = state;
    setDragging(state);
  }

  const activePreview = dragging ? preview : previewOverride ?? null;

  const metrics = activePreview
    ? barMetricsFromDates(activePreview.start, activePreview.end, layout)
    : { left, width };

  const rowHeight = hitRowHeight ?? 28;
  const textLeading = Math.max(barHeightPx - 2, 14);
  const visibleShellWidth = Math.min(Math.max(shellWidth ?? metrics.width, 8), metrics.width);

  return (
    <div
      data-gantt-bar
      data-no-pan
      className="absolute top-0 z-[5]"
      style={{
        left: metrics.left,
        width: Math.max(metrics.width, 8),
        height: rowHeight,
      }}
    >
      <div
        className={cn(
          "group absolute top-1/2 -translate-y-1/2 overflow-hidden rounded-full transition-[box-shadow,filter] duration-300 ease-out motion-reduce:transition-none",
          barShell,
          saving && "opacity-60",
          dragging && "ring-2 ring-brand-400 ring-offset-1",
          isSelected && !dragging && "relative z-10 ring-2 ring-brand-500/45 ring-offset-1 shadow-sm brightness-[1.06]",
        )}
        style={{ ...barShellStyle, height: barHeightPx, width: visibleShellWidth }}
      >
        <div
          className="absolute top-0 z-10 flex h-full w-3 cursor-ew-resize items-center justify-center opacity-70 hover:opacity-100"
          onMouseDown={(e) => startDrag(e, "resize-start")}
        >
          <span className="flex h-3 items-center gap-px" aria-hidden>
            <span className="h-full w-px bg-gray-400/80 dark:bg-gray-500" />
            <span className="h-full w-px bg-gray-400/80 dark:bg-gray-500" />
          </span>
        </div>
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => startDrag(e, "move")}
        >
          <span
            className={cn(
              "pointer-events-none absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ring-1 ring-white transition-transform duration-300 ease-out dark:ring-gray-900",
              statusDotClass,
              showTitle && "scale-110",
              isSelected && "scale-110",
            )}
            aria-hidden
          />
          <span
            className={cn(
              "pointer-events-none block min-w-0 truncate pl-5 pr-2 text-xs transition-[opacity,transform,max-width] duration-300 ease-out motion-reduce:transition-none",
              barText,
              showTitle
                ? "max-w-full translate-x-0 opacity-100"
                : "max-w-0 translate-x-1 opacity-0",
            )}
            style={{ ...barTextStyle, lineHeight: `${textLeading}px` }}
            title={item.title}
            aria-hidden={!showTitle}
          >
            {item.title}
          </span>
        </div>
        <div
          className="absolute top-0 right-0 z-10 flex h-full w-3 cursor-ew-resize items-center justify-center opacity-70 hover:opacity-100"
          onMouseDown={(e) => startDrag(e, "resize-end")}
        >
          <span className="flex h-3 items-center gap-px" aria-hidden>
            <span className="h-full w-px bg-gray-400/80 dark:bg-gray-500" />
            <span className="h-full w-px bg-gray-400/80 dark:bg-gray-500" />
          </span>
        </div>
      </div>
      {item.isVirtualEnd && !activePreview && (
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
