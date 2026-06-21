import { addDaysUtc, daysBetween } from "@/lib/gantt-scale";
import type { GanttContribution, GanttItem } from "@/types";

export interface PlanContributionBounds {
  min?: string;
  max?: string;
}

export interface PlanDragConstraints {
  minStartDate?: string;
  minContributionDate?: string;
  maxContributionDate?: string;
}

/** 计划下所有贡献记录的日期范围 */
export function getPlanContributionBounds(
  planId: string,
  contributions: GanttContribution[],
): PlanContributionBounds {
  let min: string | undefined;
  let max: string | undefined;
  for (const c of contributions) {
    if (c.planId !== planId) continue;
    for (const d of [c.occurredOn, c.occurredEndOn ?? c.occurredOn]) {
      if (!min || d < min) min = d;
      if (!max || d > max) max = d;
    }
  }
  return { min, max };
}

export function constrainPlanMove(
  newStart: string,
  durationDays: number,
  constraints: PlanDragConstraints,
): { start: string; end: string } {
  let start = newStart;
  if (constraints.minStartDate && start < constraints.minStartDate) {
    start = constraints.minStartDate;
  }
  let end = addDaysUtc(start, durationDays);

  if (constraints.maxContributionDate && end < constraints.maxContributionDate) {
    end = constraints.maxContributionDate;
    start = addDaysUtc(end, -durationDays);
    if (constraints.minStartDate && start < constraints.minStartDate) {
      start = constraints.minStartDate;
      end = addDaysUtc(start, durationDays);
    }
  }
  if (constraints.minContributionDate && start > constraints.minContributionDate) {
    start = constraints.minContributionDate;
    end = addDaysUtc(start, durationDays);
  }
  if (end < start) end = start;
  return { start, end };
}

export function constrainPlanResizeStart(
  newStart: string,
  end: string,
  constraints: PlanDragConstraints,
): string {
  let start = newStart;
  if (constraints.minStartDate && start < constraints.minStartDate) {
    start = constraints.minStartDate;
  }
  if (constraints.minContributionDate && start > constraints.minContributionDate) {
    start = constraints.minContributionDate;
  }
  if (start > end) start = end;
  return start;
}

export function constrainPlanResizeEnd(
  start: string,
  newEnd: string,
  maxContributionDate?: string,
): string {
  let end = newEnd;
  if (end < start) end = start;
  if (maxContributionDate && end < maxContributionDate) end = maxContributionDate;
  return end;
}

/** 收集某计划的所有可见后代（深度优先） */
export function collectDescendantPlans(rootId: string, items: GanttItem[]): GanttItem[] {
  const result: GanttItem[] = [];
  function walk(parentId: string) {
    for (const item of items) {
      if (item.parentId === parentId) {
        result.push(item);
        walk(item.id);
      }
    }
  }
  walk(rootId);
  return result;
}

export function shiftPlanDatesByDays(
  item: GanttItem,
  deltaDays: number,
): { start: string; end: string } {
  return {
    start: addDaysUtc(item.startDate, deltaDays),
    end: addDaysUtc(item.effectiveEnd, deltaDays),
  };
}

/** 拖动父计划时，整组预览日期 */
export function buildBoundGroupPreview(
  root: GanttItem,
  rootPreview: { start: string; end: string },
  items: GanttItem[],
): Map<string, { start: string; end: string }> {
  const deltaDays = daysBetween(root.startDate, rootPreview.start);
  const map = new Map<string, { start: string; end: string }>();
  map.set(root.id, rootPreview);
  for (const child of collectDescendantPlans(root.id, items)) {
    map.set(child.id, shiftPlanDatesByDays(child, deltaDays));
  }
  return map;
}

export function clampPlanStartToParent(childStart: string, parentStart: string): string {
  return childStart < parentStart ? parentStart : childStart;
}

/** 子计划开始不得早于父计划（按 UTC 日比较） */
export function isPlanStartBeforeParent(
  childStart: Date | null,
  parentStart: Date | null,
): boolean {
  if (!childStart || !parentStart) return false;
  return childStart.getTime() < parentStart.getTime();
}

/** 日期 YYYY-MM-DD 是否在计划条范围内 */
export function isDateWithinPlanSpan(
  date: string,
  start: string,
  end: string,
): boolean {
  return date >= start && date <= end;
}
