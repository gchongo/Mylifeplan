import { getEffectiveEndDate } from "@/lib/content-router";
import { parsePlanDateTime } from "@/lib/dates";
import { normalizeStatusKey } from "@/lib/task-status-style";
import type { GanttItem } from "@/types";

export type PlanOverdueNode = Pick<
  GanttItem,
  "status" | "endDate" | "isVirtualEnd" | "parentId"
>;

function isActivePlanStatus(status: string | undefined | null): boolean {
  const base = normalizeStatusKey(status ?? "todo");
  return base !== "done" && base !== "archived";
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

  const childMs = parsePlanDateTime(childEnd)?.getTime();
  const parentMs = parsePlanDateTime(parentEnd)?.getTime();
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

  const childMs = parsePlanDateTime(item.endDate)?.getTime();
  const parentMs = parsePlanDateTime(parent.endDate)?.getTime();
  if (childMs == null || parentMs == null) return false;

  return childMs > parentMs;
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
