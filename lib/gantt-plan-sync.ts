import { getEffectiveEndDate } from "@/lib/content-router";
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
