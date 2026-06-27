"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { patchGanttItemFromPlan, type GanttPlanPatch, type SerializedPlanForGantt } from "@/lib/gantt-plan-sync";
import { ganttPlanBarMetrics, type TimelineLayout } from "@/lib/gantt-scale";
import {
  constrainPlanMoveByMs,
  pixelDeltaToDragAmount,
  planSpanMs,
  shiftPlanByDragAmount,
  type PlanDragMode,
} from "@/lib/gantt-plan-drag";
import {
  constrainPlanResizeEnd,
  constrainPlanResizeStart,
  type PlanDragConstraints,
} from "@/lib/gantt-plan-bind";
import { getMobilePlanBarFillStyle } from "@/lib/plan-color";
import type { GanttItem } from "@/types";
import { cn } from "@/lib/utils";

type DragMode = PlanDragMode;

interface DragState {
  mode: DragMode;
  startY: number;
  origStart: string;
  origEnd: string;
  hadDueDate: boolean;
  pointerId: number;
}

interface CommitDates {
  startDate: string;
  endDate: string | null;
  body: {
    startDate: string;
    endDate?: string | null;
    shiftDescendants?: boolean;
  };
}

export function GanttMobileDraggableBar({
  item,
  layout,
  top,
  height,
  barWidthPx,
  barLeftPx,
  depth = 0,
  color,
  previewOverride,
  minStartDate,
  minContributionDate,
  maxContributionDate,
  onUpdated,
  onPreviewDates,
  onDragEnd,
  onDragFailed,
  onTaskClick,
  dragEnabled = true,
}: {
  item: GanttItem;
  layout: TimelineLayout;
  top: number;
  height: number;
  barWidthPx: number;
  barLeftPx: number;
  depth?: number;
  color: string;
  previewOverride?: { start: string; end: string } | null;
  minStartDate?: string;
  minContributionDate?: string;
  maxContributionDate?: string;
  onUpdated: (
    updated: GanttItem,
    meta?: { shiftDescendants?: boolean; previousStart?: string; fromServer?: boolean },
  ) => void;
  onPreviewDates?: (
    planId: string,
    preview: { start: string; end: string } | null,
    mode?: PlanDragMode,
  ) => void;
  onDragEnd?: () => void;
  onDragFailed?: () => void;
  onTaskClick?: () => void;
  dragEnabled?: boolean;
}) {
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<{ start: string; end: string } | null>(null);
  const [commitPreview, setCommitPreview] = useState<{ start: string; end: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const dragConstraints = useMemo<PlanDragConstraints>(
    () => ({
      minStartDate,
      minContributionDate,
      maxContributionDate,
    }),
    [minStartDate, minContributionDate, maxContributionDate],
  );

  const applyDrag = useCallback(
    (state: DragState, clientY: number) => {
      const dragAmount = pixelDeltaToDragAmount(clientY - state.startY, layout);
      if (dragAmount === 0 && state.mode === "move") {
        setPreview(null);
        onPreviewDates?.(item.id, null, state.mode);
        return;
      }

      if (state.mode === "move") {
        const durationMs = planSpanMs(state.origStart, state.origEnd);
        const rawStart = shiftPlanByDragAmount(state.origStart, dragAmount, layout);
        const { start, end } = constrainPlanMoveByMs(rawStart, durationMs, dragConstraints);
        setPreview({ start, end });
        onPreviewDates?.(item.id, { start, end }, state.mode);
        return;
      }

      if (state.mode === "resize-start") {
        const rawStart = shiftPlanByDragAmount(state.origStart, dragAmount, layout);
        const start = constrainPlanResizeStart(rawStart, state.origEnd, dragConstraints);
        setPreview({ start, end: state.origEnd });
        onPreviewDates?.(item.id, { start, end: state.origEnd }, state.mode);
        return;
      }

      const rawEnd = shiftPlanByDragAmount(state.origEnd, dragAmount, layout);
      const end = constrainPlanResizeEnd(state.origStart, rawEnd, maxContributionDate);
      setPreview({ start: state.origStart, end });
      onPreviewDates?.(item.id, { start: state.origStart, end }, state.mode);
    },
    [layout, item.id, onPreviewDates, dragConstraints, maxContributionDate],
  );

  const computeCommitDates = useCallback(
    (state: DragState, clientY: number): CommitDates | null => {
      const dragAmount = pixelDeltaToDragAmount(clientY - state.startY, layout);
      if (dragAmount === 0 && state.mode === "move") return null;

      let startDate = state.origStart;
      let endDate: string | null = state.hadDueDate ? state.origEnd : null;

      if (state.mode === "move") {
        const durationMs = planSpanMs(state.origStart, state.origEnd);
        const moved = constrainPlanMoveByMs(
          shiftPlanByDragAmount(state.origStart, dragAmount, layout),
          durationMs,
          dragConstraints,
        );
        startDate = moved.start;
        if (state.hadDueDate) endDate = moved.end;
      } else if (state.mode === "resize-start") {
        startDate = constrainPlanResizeStart(
          shiftPlanByDragAmount(state.origStart, dragAmount, layout),
          state.origEnd,
          dragConstraints,
        );
      } else {
        endDate = constrainPlanResizeEnd(
          state.origStart,
          shiftPlanByDragAmount(state.origEnd, dragAmount, layout),
          maxContributionDate,
        );
      }

      if (startDate === item.startDate && endDate === (item.endDate ?? null)) return null;

      const body: CommitDates["body"] = { startDate };
      if (state.hadDueDate || state.mode === "resize-end") {
        body.endDate = endDate;
      }
      if (state.mode === "move") {
        body.shiftDescendants = true;
      }

      return { startDate, endDate, body };
    },
    [layout, item.startDate, item.endDate, dragConstraints, maxContributionDate],
  );

  const commitDrag = useCallback(
    async (state: DragState, clientY: number) => {
      const commit = computeCommitDates(state, clientY);
      if (!commit) {
        onPreviewDates?.(item.id, null, state.mode);
        onDragEnd?.();
        return;
      }

      const previousStart = item.startDate;
      const optimisticPreview = {
        start: commit.startDate,
        end: commit.endDate ?? item.effectiveEnd,
      };

      setPreview(null);
      setCommitPreview(optimisticPreview);
      onPreviewDates?.(item.id, optimisticPreview, state.mode);

      onUpdated(
        patchGanttItemFromPlan(item, {
          id: item.id,
          startDate: commit.startDate,
          endDate: commit.endDate,
        }),
        {
          shiftDescendants: commit.body.shiftDescendants === true,
          previousStart,
        },
      );

      setSaving(true);
      try {
        const res = await fetch(`/api/plans/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(commit.body),
        });
        const data = await res.json();
        if (!res.ok) {
          onDragFailed?.();
          return;
        }

        const plan = data.plan as GanttPlanPatch;
        const optimisticItem = patchGanttItemFromPlan(item, {
          id: item.id,
          startDate: commit.startDate,
          endDate: commit.endDate,
        });
        onUpdated(patchGanttItemFromPlan(optimisticItem, plan), { fromServer: true });
        dispatchPlanUpdated({ plan: data.plan as SerializedPlanForGantt });
      } catch {
        onDragFailed?.();
      } finally {
        setSaving(false);
        setCommitPreview(null);
        onPreviewDates?.(item.id, null, state.mode);
        onDragEnd?.();
      }
    },
    [item, computeCommitDates, onUpdated, onDragFailed, onPreviewDates, onDragEnd],
  );

  useEffect(() => {
    if (!dragging) return;

    function onMove(e: PointerEvent) {
      const state = dragRef.current;
      if (!state || e.pointerId !== state.pointerId) return;
      e.preventDefault();
      applyDrag(state, e.clientY);
    }

    function onUp(e: PointerEvent) {
      const state = dragRef.current;
      if (!state || e.pointerId !== state.pointerId) return;
      e.preventDefault();
      dragRef.current = null;
      setDragging(null);
      rootRef.current?.releasePointerCapture(e.pointerId);

      const moved = Math.abs(e.clientY - state.startY) > 3;
      if (!moved) {
        setPreview(null);
        onPreviewDates?.(item.id, null, state.mode);
        onDragEnd?.();
        onTaskClick?.();
        return;
      }

      void commitDrag(state, e.clientY);
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, applyDrag, commitDrag, onTaskClick, item.id, onPreviewDates, onDragEnd]);

  function startDrag(e: React.PointerEvent, mode: DragMode) {
    if (!dragEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    const state: DragState = {
      mode,
      startY: e.clientY,
      origStart: item.startDate,
      origEnd: item.effectiveEnd,
      hadDueDate: Boolean(item.endDate),
      pointerId: e.pointerId,
    };
    dragRef.current = state;
    setDragging(state);
    rootRef.current?.setPointerCapture(e.pointerId);
  }

  const activePreview = dragging ? preview : commitPreview ?? previewOverride ?? null;

  const metrics = activePreview
    ? ganttPlanBarMetrics(activePreview.start, activePreview.end, layout, {
        isVirtualEnd: item.isVirtualEnd,
      })
    : { left: top, width: height };

  const barHeight = Math.max(metrics.width, 6);

  return (
    <div
      ref={rootRef}
      data-gantt-bar
      data-no-pan
      className="pointer-events-auto absolute z-[5]"
      style={{
        top: metrics.left,
        height: barHeight,
        width: barWidthPx,
        left: barLeftPx,
        touchAction: dragEnabled ? "none" : "auto",
      }}
    >
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-full transition-[box-shadow] duration-200",
          saving && "opacity-60",
          (dragging || commitPreview) && "ring-2 ring-brand-400 ring-offset-1",
        )}
        style={{
          ...getMobilePlanBarFillStyle(color, depth),
          touchAction: dragEnabled ? "none" : "auto",
        }}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-10 flex h-4 items-start justify-center",
            dragEnabled && "cursor-ns-resize",
          )}
          onPointerDown={(e) => startDrag(e, "resize-start")}
        >
          <span className="mt-0.5 flex w-3 flex-col items-center gap-px" aria-hidden>
            <span className="h-px w-full bg-gray-400/80 dark:bg-gray-500" />
            <span className="h-px w-full bg-gray-400/80 dark:bg-gray-500" />
          </span>
        </div>
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 top-4",
            dragEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
          )}
          onPointerDown={(e) => {
            if (!dragEnabled) {
              e.stopPropagation();
              onTaskClick?.();
              return;
            }
            startDrag(e, "move");
          }}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 flex h-4 items-end justify-center",
            dragEnabled && "cursor-ns-resize",
          )}
          onPointerDown={(e) => startDrag(e, "resize-end")}
        >
          <span className="mb-0.5 flex w-3 flex-col items-center gap-px" aria-hidden>
            <span className="h-px w-full bg-gray-400/80 dark:bg-gray-500" />
            <span className="h-px w-full bg-gray-400/80 dark:bg-gray-500" />
          </span>
        </div>
      </div>
    </div>
  );
}
