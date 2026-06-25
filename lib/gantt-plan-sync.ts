import { getEffectiveEndDate } from "@/lib/content-router";
import { parsePlanDateTime } from "@/lib/dates";
import { collectDescendantPlans } from "@/lib/gantt-plan-bind";
import { shiftPlanDateTime } from "@/lib/gantt-plan-drag";
import type { GanttItem } from "@/types";

export type GanttPlanPatch = {
  id: string;
  startDate: string | null;
  endDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
};

export function patchGanttItemFromPlan(item: GanttItem, plan: GanttPlanPatch): GanttItem {
  if (!plan.startDate) return item;
  const { effectiveEnd, isVirtualEnd } = getEffectiveEndDate({
    startDate: plan.startDate,
    dueDate: plan.endDate ?? null,
  });
  return {
    ...item,
    startDate: plan.startDate,
    endDate: plan.endDate ?? null,
    ...(plan.actualStartDate !== undefined && { actualStartDate: plan.actualStartDate }),
    ...(plan.actualEndDate !== undefined && { actualEndDate: plan.actualEndDate }),
    effectiveEnd: effectiveEnd ?? plan.startDate,
    isVirtualEnd,
  };
}

export function shiftDescendantGanttItems(
  items: GanttItem[],
  rootId: string,
  previousStart: string,
  nextStart: string,
): GanttItem[] {
  const prevMs = parsePlanDateTime(previousStart)?.getTime();
  const nextMs = parsePlanDateTime(nextStart)?.getTime();
  if (prevMs == null || nextMs == null) return items;
  const deltaMs = nextMs - prevMs;
  if (deltaMs === 0) return items;

  const descendantIds = new Set(collectDescendantPlans(rootId, items).map((item) => item.id));
  return items.map((item) => {
    if (!descendantIds.has(item.id)) return item;
    const shiftedStart = shiftPlanDateTime(item.startDate, deltaMs);
    const shiftedEnd = item.endDate ? shiftPlanDateTime(item.endDate, deltaMs) : item.endDate;
    const shiftedEffective = shiftPlanDateTime(item.effectiveEnd, deltaMs);
    return {
      ...item,
      startDate: shiftedStart,
      endDate: shiftedEnd,
      effectiveEnd: shiftedEffective,
    };
  });
}

export function applyGanttPlanPatch(
  items: GanttItem[],
  plan: GanttPlanPatch,
  options?: { shiftDescendants?: boolean; previousStart?: string },
): GanttItem[] {
  let next = items.map((item) => (item.id === plan.id ? patchGanttItemFromPlan(item, plan) : item));
  if (
    options?.shiftDescendants &&
    options.previousStart &&
    plan.startDate &&
    options.previousStart !== plan.startDate
  ) {
    next = shiftDescendantGanttItems(next, plan.id, options.previousStart, plan.startDate);
  }
  return next;
}
