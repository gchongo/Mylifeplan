import { getEffectiveEndDate, isPlanUnscheduled } from "@/lib/content-router";
import { parsePlanDateTime } from "@/lib/dates";
import { collectDescendantPlans } from "@/lib/gantt-plan-bind";
import { shiftPlanDateTime } from "@/lib/gantt-plan-drag";
import { resolveUnscheduledGanttAnchor } from "@/lib/gantt-unscheduled-anchor";
import type { GanttItem } from "@/types";

export type GanttPlanPatch = {
  id: string;
  startDate: string | null;
  endDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  status?: string;
};

export type SerializedPlanForGantt = {
  id: string;
  title: string;
  startDate: string | null;
  endDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  parentPlanId?: string | null;
  status?: string;
  color?: string | null;
};

export function serializedPlanToGanttItem(plan: SerializedPlanForGantt): GanttItem | null {
  const startDate = plan.startDate;
  if (!startDate) return null;
  const endDate = plan.endDate ?? null;
  const { effectiveEnd, isVirtualEnd } = getEffectiveEndDate({
    startDate,
    dueDate: endDate,
  });
  if (!effectiveEnd) return null;
  return {
    id: plan.id,
    title: plan.title,
    startDate,
    endDate,
    actualStartDate: plan.actualStartDate ?? null,
    actualEndDate: plan.actualEndDate ?? null,
    effectiveEnd,
    isVirtualEnd,
    parentId: plan.parentPlanId ?? null,
    status: plan.status,
    color: plan.color ?? null,
  };
}

export function mergeGanttItem(items: GanttItem[], item: GanttItem): GanttItem[] {
  const without = items.filter((row) => row.id !== item.id);
  return [...without, item].sort((a, b) => {
    if (a.isUnscheduled !== b.isUnscheduled) return a.isUnscheduled ? 1 : -1;
    return a.startDate.localeCompare(b.startDate);
  });
}

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
    ...(plan.status !== undefined && { status: plan.status }),
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

function hasGanttAncestor(
  parentPlanId: string | null,
  onGantt: Set<string>,
  byId: Map<string, { parentPlanId: string | null }>,
): boolean {
  let cur = parentPlanId;
  while (cur) {
    if (onGantt.has(cur)) return true;
    cur = byId.get(cur)?.parentPlanId ?? null;
  }
  return false;
}

/** Apply a saved plan snapshot to the in-memory gantt list (parent / schedule changes). */
export function syncGanttItemsFromPlanUpdate(
  items: GanttItem[],
  plan: SerializedPlanForGantt,
  rangeFrom: string,
): GanttItem[] {
  const parentId = plan.parentPlanId ?? null;
  const unscheduled = isPlanUnscheduled({ startDate: plan.startDate, endDate: plan.endDate ?? null });

  if (unscheduled && !parentId) {
    return items.filter((item) => item.id !== plan.id);
  }

  if (!unscheduled && plan.startDate) {
    const scheduled = serializedPlanToGanttItem(plan);
    if (!scheduled) return items.filter((item) => item.id !== plan.id);
    return mergeGanttItem(items, { ...scheduled, parentId });
  }

  const onGantt = new Set(items.map((item) => item.id));
  const anchorRows = new Map<
    string,
    { id: string; parentPlanId: string | null; startDate: string | null }
  >();
  const computedAnchors = new Map<string, string>();

  for (const item of items) {
    anchorRows.set(item.id, {
      id: item.id,
      parentPlanId: item.parentId ?? null,
      startDate: item.isUnscheduled ? null : item.startDate,
    });
    if (item.isUnscheduled) {
      computedAnchors.set(item.id, item.startDate);
    }
  }

  anchorRows.set(plan.id, {
    id: plan.id,
    parentPlanId: parentId,
    startDate: null,
  });

  if (!hasGanttAncestor(parentId, onGantt, anchorRows)) {
    return items.filter((item) => item.id !== plan.id);
  }

  const anchor = resolveUnscheduledGanttAnchor(parentId, anchorRows, computedAnchors, rangeFrom);

  return mergeGanttItem(items, {
    id: plan.id,
    title: plan.title,
    startDate: anchor,
    endDate: null,
    effectiveEnd: anchor,
    isVirtualEnd: false,
    parentId,
    status: plan.status,
    color: plan.color ?? null,
    isUnscheduled: true,
  });
}
