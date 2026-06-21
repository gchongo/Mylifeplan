import { getEffectiveEndDate } from "@/lib/content-router";
import { parsePlanDateTime } from "@/lib/dates";
import { normalizeStatusKey } from "@/lib/task-status-style";
import type { GanttItem } from "@/types";

export type PlanOverdueNode = Pick<
  GanttItem,
  "status" | "endDate" | "isVirtualEnd" | "parentId"
>;

export interface PlanOverrunTail {
  from: string;
  to: string;
}

function isActivePlanStatus(status: string | undefined | null): boolean {
  const base = normalizeStatusKey(status ?? "todo");
  return base !== "done" && base !== "archived";
}

function isDoneOrArchived(status: string | undefined | null): boolean {
  const base = normalizeStatusKey(status ?? "todo");
  return base === "done" || base === "archived";
}

function endMs(end: string | null | undefined): number | null {
  if (!end) return null;
  return parsePlanDateTime(end)?.getTime() ?? null;
}

/**
 * 超期：子计划有明确结束时间，且晚于父计划的结束时间（精确到分钟）。
 * 顶层计划、无结束时间、或虚拟截止的计划不参与超期判定。
 */
export function isPlanOverdue(
  item: PlanOverdueNode,
  planById: Map<string, PlanOverdueNode>,
): boolean {
  if (!isActivePlanStatus(item.status)) return false;
  if (!item.parentId || item.isVirtualEnd) return false;

  const childEnd = item.endDate;
  if (!childEnd) return false;

  const parent = planById.get(item.parentId);
  if (!parent || parent.isVirtualEnd) return false;

  const parentEnd = parent.endDate;
  if (!parentEnd) return false;

  const childMs = endMs(childEnd);
  const parentMs = endMs(parentEnd);
  if (childMs == null || parentMs == null) return false;

  return childMs > parentMs;
}

/** 已知父计划结束时间时的便捷判定（详情页等） */
export function isSubPlanOverdueAgainstParent(
  item: Pick<PlanOverdueNode, "status" | "endDate" | "isVirtualEnd">,
  parent: Pick<PlanOverdueNode, "endDate" | "isVirtualEnd"> | null | undefined,
): boolean {
  if (!isActivePlanStatus(item.status)) return false;
  if (item.isVirtualEnd || !item.endDate) return false;
  if (!parent || parent.isVirtualEnd || !parent.endDate) return false;

  const childMs = endMs(item.endDate);
  const parentMs = endMs(parent.endDate);
  if (childMs == null || parentMs == null) return false;

  return childMs > parentMs;
}

/** 进行中子计划：在条末尾绘制红色超期段（父结束 → 子结束） */
export function getActiveSubPlanOverrunTail(
  item: PlanOverdueNode,
  planById: Map<string, PlanOverdueNode>,
): PlanOverrunTail | null {
  if (!isPlanOverdue(item, planById) || !item.parentId || !item.endDate) return null;
  const parent = planById.get(item.parentId);
  if (!parent?.endDate) return null;
  return { from: parent.endDate, to: item.endDate };
}

function collectDescendants(parentId: string, allItems: GanttItem[]): GanttItem[] {
  const out: GanttItem[] = [];
  const walk = (pid: string) => {
    for (const p of allItems) {
      if (p.parentId === pid) {
        out.push(p);
        walk(p.id);
      }
    }
  };
  walk(parentId);
  return out;
}

/**
 * 父计划：当已完成/归档的子计划结束时间晚于父计划结束时，在父条末尾追加红色超期段。
 * 进行中的超期仍只显示在子计划条上。
 */
export function getParentRolledUpOverrunTail(
  item: Pick<GanttItem, "id" | "endDate" | "isVirtualEnd">,
  allItems: GanttItem[],
): PlanOverrunTail | null {
  if (!item.endDate || item.isVirtualEnd) return null;
  const parentMs = endMs(item.endDate);
  if (parentMs == null) return null;

  let maxOverrunEnd: string | null = null;
  let maxMs = parentMs;

  for (const child of collectDescendants(item.id, allItems)) {
    if (!isDoneOrArchived(child.status)) continue;
    if (!child.endDate || child.isVirtualEnd) continue;
    const childMs = endMs(child.endDate);
    if (childMs == null || childMs <= parentMs) continue;
    if (childMs > maxMs) {
      maxMs = childMs;
      maxOverrunEnd = child.endDate;
    }
  }

  if (!maxOverrunEnd) return null;
  return { from: item.endDate, to: maxOverrunEnd };
}

export function planOverdueNode(plan: {
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): Pick<PlanOverdueNode, "status" | "endDate" | "isVirtualEnd"> {
  const { isVirtualEnd } = getEffectiveEndDate({
    startDate: plan.startDate ?? undefined,
    dueDate: plan.endDate ?? undefined,
  });
  return {
    status: plan.status ?? "not_started",
    endDate: plan.endDate ?? null,
    isVirtualEnd,
  };
}
