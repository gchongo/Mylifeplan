import { addDaysUtc, daysBetween } from "@/lib/gantt-scale";
import type { GanttItem } from "@/types";

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
