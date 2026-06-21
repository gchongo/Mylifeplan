"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getEffectiveEndDate } from "@/lib/content-router";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import {
  addDaysUtc,
  daysBetween,
  pixelDeltaToDays,
  type TimelineLayout,
} from "@/lib/gantt-scale";
import { normalizePlanColor, planColorRgba } from "@/lib/plan-color";
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
  planColor,
  onUpdated,
  onTaskClick,
  bareShell = false,
  hitRowHeight,
  bareShellInsetTop = 0,
  onPreviewDates,
}: {
  item: GanttItem;
  layout: TimelineLayout;
  left: number;
  width: number;
  barShell: string;
  barShellStyle?: CSSProperties;
  barText: string;
  barTextStyle?: CSSProperties;
  planColor?: string | null;
  onUpdated: (updated: GanttItem) => void;
  onTaskClick?: () => void;
  /** 无可见边框（组框一级计划），保留完整拖拽热区 */
  bareShell?: boolean;
  hitRowHeight?: number;
  /** 组框内边距：一级标题下移，避免贴顶 */
  bareShellInsetTop?: number;
  onPreviewDates?: (planId: string, preview: { start: string; end: string } | null) => void;
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
        onPreviewDates?.(item.id, null);
        return;
      }

      if (state.mode === "move") {
        const duration = daysBetween(state.origStart, state.origEnd);
        let newStart = addDaysUtc(state.origStart, deltaDays);
        let newEnd = addDaysUtc(newStart, duration);
        setPreview({ start: newStart, end: newEnd });
        onPreviewDates?.(item.id, { start: newStart, end: newEnd });
        return;
      }

      if (state.mode === "resize-start") {
        let newStart = addDaysUtc(state.origStart, deltaDays);
        if (newStart > state.origEnd) newStart = state.origEnd;
        setPreview({ start: newStart, end: state.origEnd });
        onPreviewDates?.(item.id, { start: newStart, end: state.origEnd });
        return;
      }

      let newEnd = addDaysUtc(state.origEnd, deltaDays);
      if (newEnd < state.origStart) newEnd = state.origStart;
      setPreview({ start: state.origStart, end: newEnd });
      onPreviewDates?.(item.id, { start: state.origStart, end: newEnd });
    },
    [layout, item.id, onPreviewDates],
  );

  const commitDrag = useCallback(
    async (state: DragState, clientX: number) => {
      const deltaDays = pixelDeltaToDays(clientX - state.startX, layout);
      if (deltaDays === 0 && state.mode === "move") return;

      let startDate = state.origStart;
      let endDate: string | null = state.hadDueDate ? state.origEnd : null;

      if (state.mode === "move") {
        const duration = daysBetween(state.origStart, state.origEnd);
        startDate = addDaysUtc(state.origStart, deltaDays);
        const newEnd = addDaysUtc(startDate, duration);
        if (state.hadDueDate) endDate = newEnd;
      } else if (state.mode === "resize-start") {
        startDate = addDaysUtc(state.origStart, deltaDays);
        if (startDate > state.origEnd) startDate = state.origEnd;
      } else {
        const newEnd = addDaysUtc(state.origEnd, deltaDays);
        endDate = newEnd >= state.origStart ? newEnd : state.origStart;
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
      onPreviewDates?.(item.id, null);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, applyDrag, commitDrag, onTaskClick, item.id, onPreviewDates]);

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

  const fullHeight = hitRowHeight ?? 28;
  const shellHeight = bareShell
    ? Math.max(fullHeight - bareShellInsetTop, 20)
    : fullHeight;
  const pillColor = normalizePlanColor(planColor);

  return (
    <div
      data-gantt-bar
      data-no-pan
      className={cn(
        "absolute",
        bareShell ? "top-0" : "top-1/2 -translate-y-1/2",
      )}
      style={{
        left: metrics.left,
        width: Math.max(metrics.width, 8),
        height: bareShell ? shellHeight : undefined,
        top: bareShell ? bareShellInsetTop : undefined,
      }}
    >
      <div
        className={cn(
          "group relative w-full overflow-hidden rounded-md",
          bareShell ? "h-full min-h-7" : "h-7",
          barShell,
          saving && "opacity-60",
          dragging && "ring-2 ring-brand-400 ring-offset-1",
          bareShell && "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
        )}
        style={barShellStyle}
      >
        <div
          className={cn(
            "absolute top-0 z-10 h-full cursor-ew-resize hover:bg-black/5 dark:hover:bg-white/10",
            bareShell ? "left-0 w-3" : "left-0 w-2 opacity-0 group-hover:opacity-100",
          )}
          onMouseDown={(e) => startDrag(e, "resize-start")}
        />
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => startDrag(e, "move")}
        >
          <span
            className={cn(
              "pointer-events-none block max-w-full truncate text-xs leading-7",
              bareShell
                ? "inline-block rounded-md px-2 font-semibold shadow-sm"
                : "px-2",
              barText,
            )}
            style={{
              ...barTextStyle,
              ...(bareShell
                ? {
                    backgroundColor: planColorRgba(pillColor, 0.12),
                    boxShadow: `inset 0 0 0 1px ${planColorRgba(pillColor, 0.35)}`,
                  }
                : undefined),
            }}
          >
            {item.title}
          </span>
        </div>
        <div
          className={cn(
            "absolute top-0 z-10 h-full cursor-ew-resize hover:bg-black/5 dark:hover:bg-white/10",
            bareShell ? "right-0 w-3" : "right-0 w-2 opacity-0 group-hover:opacity-100",
          )}
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
