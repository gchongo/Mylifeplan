import { formatPlanDateTime, parsePlanDateTime } from "@/lib/dates";
import { normalizeStatusKey } from "@/lib/task-status-style";
import type { GanttItem } from "@/types";

export interface PlanExecutionSpan {
  from: string;
  to: string;
}

export interface ParentActualExecutionFill {
  green: PlanExecutionSpan | null;
  red: PlanExecutionSpan | null;
}

export type ActualTimelineNode = Pick<
  GanttItem,
  | "id"
  | "parentId"
  | "status"
  | "endDate"
  | "actualStartDate"
  | "actualEndDate"
  | "isVirtualEnd"
>;

function isDoneOrArchived(status: string | undefined | null): boolean {
  const base = normalizeStatusKey(status ?? "todo");
  return base === "done" || base === "archived";
}

function isInProgress(status: string | undefined | null): boolean {
  return normalizeStatusKey(status ?? "todo") === "in_progress";
}

function isNotStarted(status: string | undefined | null): boolean {
  return normalizeStatusKey(status ?? "todo") === "todo";
}

function timeMs(value: string | null | undefined): number | null {
  if (!value) return null;
  return parsePlanDateTime(value)?.getTime() ?? null;
}

function getDirectChildren(parentId: string, items: GanttItem[]): GanttItem[] {
  return items.filter((item) => item.parentId === parentId && !item.contributionOnly);
}

/**
 * 用于父条汇总与超期判定：
 * - 已完成：实际结束优先，否则今天
 * - 进行中：未填实际结束则用今天
 * - 未开始：若已过计划期限则用今天，否则不参与汇总
 */
export function getEffectiveActualEnd(item: ActualTimelineNode, nowIso: string): string | null {
  if (item.actualEndDate) return item.actualEndDate;

  if (isDoneOrArchived(item.status)) {
    return nowIso;
  }

  if (isInProgress(item.status)) {
    return nowIso;
  }

  if (isNotStarted(item.status)) {
    const planEndMs = timeMs(item.endDate ?? null);
    const nowMs = timeMs(nowIso);
    if (planEndMs != null && nowMs != null && nowMs > planEndMs) {
      return nowIso;
    }
    return null;
  }

  return null;
}

/** 条内实际执行线：需要实际开始时间 */
export function getPlanActualExecutionSpan(
  item: ActualTimelineNode,
  nowIso: string,
): PlanExecutionSpan | null {
  if (!item.actualStartDate) return null;
  const end = getEffectiveActualEnd(item, nowIso);
  if (!end) return null;
  const startMs = timeMs(item.actualStartDate);
  const endMs = timeMs(end);
  if (startMs == null || endMs == null || endMs < startMs) return null;
  return { from: item.actualStartDate, to: end };
}

export function getParentActualExecutionFill(
  parent: Pick<GanttItem, "id" | "endDate" | "isVirtualEnd">,
  items: GanttItem[],
  nowIso: string,
): ParentActualExecutionFill {
  if (!parent.endDate || parent.isVirtualEnd) {
    return { green: null, red: null };
  }

  const children = getDirectChildren(parent.id, items);
  if (children.length === 0) {
    return { green: null, red: null };
  }

  const parentEndMs = timeMs(parent.endDate);
  if (parentEndMs == null) {
    return { green: null, red: null };
  }

  let maxEnd: string | null = null;
  let maxEndMs = -Infinity;

  for (const child of children) {
    const effectiveEnd = getEffectiveActualEnd(child, nowIso);
    if (!effectiveEnd) continue;
    const ms = timeMs(effectiveEnd);
    if (ms == null) continue;
    if (ms > maxEndMs) {
      maxEndMs = ms;
      maxEnd = effectiveEnd;
    }
  }

  if (!maxEnd) {
    return { green: null, red: null };
  }

  const allChildrenDone = children.every((child) => isDoneOrArchived(child.status));

  if (maxEndMs > parentEndMs) {
    return {
      green: null,
      red: { from: parent.endDate, to: maxEnd },
    };
  }

  if (allChildrenDone && maxEndMs < parentEndMs) {
    return {
      green: { from: maxEnd, to: parent.endDate },
      red: null,
    };
  }

  return { green: null, red: null };
}

export function nowPlanIso(): string {
  return formatPlanDateTime(new Date())!;
}
