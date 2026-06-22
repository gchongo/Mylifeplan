import { formatPlanDateTime, parsePlanDateTime, planRangeEdgeMs } from "@/lib/dates";
import { normalizeStatusKey } from "@/lib/task-status-style";
import type { GanttItem } from "@/types";

export type ActualEndKind = "fixed" | "open";

export interface PlanExecutionSpan {
  from: string;
  to: string;
  endKind: ActualEndKind;
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

/** 已完成计划的结束：优先实际结束，其次计划结束；不使用「今天」 */
function resolvedCompletedEnd(item: ActualTimelineNode): string | null {
  if (item.actualEndDate) return item.actualEndDate;
  if (item.endDate) return item.endDate;
  return null;
}

/**
 * 用于父条绿/红汇总：
 * - 已完成：实际/计划结束（今天之前）
 * - 进行中：未填实际结束则用今天
 * - 未开始且已过计划期限：今天
 */
export function getEffectiveActualEnd(item: ActualTimelineNode, nowIso: string): string | null {
  if (item.actualEndDate) return item.actualEndDate;

  if (isDoneOrArchived(item.status)) {
    return resolvedCompletedEnd(item);
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

/**
 * 叶子执行线：只依赖「实际开始/结束」与「今天」，不直接读计划起止。
 *
 * 与计划窗口相对今天的三种情况：
 * - 计划结束在今天之前（已过期）：有实际开始、无实际结束 → 开放射线到今天（可超出计划结束）
 * - 计划开始在今天之后（未到期）：无实际开始 → 不画；实际开始晚于今天 → 不画
 * - 计划横跨今天：有实际开始、无实际结束 → 开放射线到今天
 */
function getLeafExecutionSpan(item: ActualTimelineNode, nowIso: string): PlanExecutionSpan | null {
  if (!item.actualStartDate) return null;

  const startMs = timeMs(item.actualStartDate);
  if (startMs == null) return null;

  if (item.actualEndDate) {
    const endMs = timeMs(item.actualEndDate);
    if (endMs == null || endMs < startMs) return null;
    return { from: item.actualStartDate, to: item.actualEndDate, endKind: "fixed" };
  }

  if (isDoneOrArchived(item.status)) {
    return null;
  }

  const endMs = timeMs(nowIso);
  if (endMs == null || endMs < startMs) return null;
  return { from: item.actualStartDate, to: nowIso, endKind: "open" };
}

export type AggregatedChildNode = Pick<
  GanttItem,
  "actualStartDate" | "actualEndDate" | "status" | "endDate"
>;

function allChildrenHaveActualBounds(children: AggregatedChildNode[]): boolean {
  return (
    children.length > 0 &&
    children.every((child) => Boolean(child.actualStartDate && child.actualEndDate))
  );
}

function earliestActualStart(children: AggregatedChildNode[]): string | null {
  let minStart: string | null = null;
  let minStartMs = Infinity;

  for (const child of children) {
    if (!child.actualStartDate) continue;
    const ms = timeMs(child.actualStartDate);
    if (ms != null && ms < minStartMs) {
      minStartMs = ms;
      minStart = child.actualStartDate;
    }
  }

  return minStart;
}

function latestActualEnd(children: AggregatedChildNode[]): string | null {
  let maxEnd: string | null = null;
  let maxEndMs = -Infinity;

  for (const child of children) {
    if (!child.actualEndDate) continue;
    const ms = timeMs(child.actualEndDate);
    if (ms != null && ms > maxEndMs) {
      maxEndMs = ms;
      maxEnd = child.actualEndDate;
    }
  }

  return maxEnd;
}

function getParentAggregatedExecutionSpan(
  children: AggregatedChildNode[],
  nowIso: string,
): PlanExecutionSpan | null {
  const minStart = earliestActualStart(children);
  if (!minStart) return null;

  const minStartMs = timeMs(minStart);
  if (minStartMs == null) return null;

  if (allChildrenHaveActualBounds(children)) {
    const maxEnd = latestActualEnd(children);
    if (!maxEnd) return null;
    const maxEndMs = timeMs(maxEnd);
    if (maxEndMs == null || maxEndMs < minStartMs) return null;
    return { from: minStart, to: maxEnd, endKind: "fixed" };
  }

  const nowMs = timeMs(nowIso);
  if (nowMs == null || nowMs < minStartMs) return null;
  return { from: minStart, to: nowIso, endKind: "open" };
}

/**
 * 叶子计划：用自身实际起止；有子计划的一级/父计划：从子计划汇总。
 */
export function getPlanActualExecutionSpan(
  item: ActualTimelineNode,
  items: GanttItem[],
  nowIso: string,
): PlanExecutionSpan | null {
  const children = getDirectChildren(item.id, items);
  if (children.length > 0) {
    return getParentAggregatedExecutionSpan(children, nowIso);
  }
  return getLeafExecutionSpan(item, nowIso);
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

  if (allChildrenHaveActualBounds(children)) {
    maxEnd = latestActualEnd(children);
    maxEndMs = maxEnd ? timeMs(maxEnd) ?? -Infinity : -Infinity;
  } else {
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
  }

  if (!maxEnd) {
    return { green: null, red: null };
  }

  const allChildrenDone = children.every((child) => isDoneOrArchived(child.status));
  const fullyBounded = allChildrenHaveActualBounds(children);

  if (maxEndMs > parentEndMs) {
    return {
      green: null,
      red: { from: parent.endDate, to: maxEnd, endKind: "fixed" },
    };
  }

  if (fullyBounded && allChildrenDone && maxEndMs < parentEndMs) {
    return {
      green: { from: maxEnd, to: parent.endDate, endKind: "fixed" },
      red: null,
    };
  }

  return { green: null, red: null };
}

/** 叶子计划：有实际结束且有计划截止时，按二者差值显示绿/红条 */
function getLeafActualExecutionFill(
  item: Pick<GanttItem, "endDate" | "actualEndDate" | "isVirtualEnd">,
): ParentActualExecutionFill {
  if (!item.endDate || item.isVirtualEnd || !item.actualEndDate) {
    return { green: null, red: null };
  }

  const planEndMs = planRangeEdgeMs(item.endDate, "end");
  const actualEndMs = timeMs(item.actualEndDate);
  if (planEndMs == null || actualEndMs == null) {
    return { green: null, red: null };
  }

  if (actualEndMs > planEndMs) {
    return {
      green: null,
      red: { from: item.endDate, to: item.actualEndDate, endKind: "fixed" },
    };
  }

  if (actualEndMs < planEndMs) {
    return {
      green: { from: item.actualEndDate, to: item.endDate, endKind: "fixed" },
      red: null,
    };
  }

  return { green: null, red: null };
}

/**
 * 有计划条绿/红尾：叶子看自身实际结束 vs 计划结束；有子项时汇总子计划。
 */
export function getPlanActualExecutionFill(
  item: Pick<GanttItem, "id" | "endDate" | "actualEndDate" | "isVirtualEnd">,
  items: GanttItem[],
  nowIso: string,
): ParentActualExecutionFill {
  const children = getDirectChildren(item.id, items);
  if (children.length > 0) {
    return getParentActualExecutionFill(item, items, nowIso);
  }
  return getLeafActualExecutionFill(item);
}

export function nowPlanIso(): string {
  return formatPlanDateTime(new Date())!;
}

/** 详情页展示：有子计划时由子计划汇总的实际起止说明 */
export function describeAggregatedActualTimes(
  children: AggregatedChildNode[],
  nowIso: string = nowPlanIso(),
): {
  start: string | null;
  end: string | null;
  endOpen: boolean;
} {
  const span = getParentAggregatedExecutionSpan(children, nowIso);
  if (!span) {
    return { start: null, end: null, endOpen: false };
  }
  return {
    start: span.from,
    end: span.to,
    endOpen: span.endKind === "open",
  };
}
