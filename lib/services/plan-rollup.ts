import type { PlanStatus } from "@prisma/client";

export function deriveStatusFromDirectChildren(
  childStatuses: PlanStatus[],
): PlanStatus | null {
  if (childStatuses.length === 0) return null;

  const active = childStatuses.filter((s) => s !== "archived");
  if (active.length === 0) return null;

  if (active.every((s) => s === "done")) return "done";
  if (
    active.some((s) => s === "in_progress") ||
    (active.some((s) => s === "done") && active.some((s) => s !== "done"))
  ) {
    return "in_progress";
  }
  return "not_started";
}

export function deriveParentStatus(
  ownStatus: PlanStatus,
  childStatuses: PlanStatus[],
): PlanStatus {
  return deriveStatusFromDirectChildren(childStatuses) ?? ownStatus;
}

export const ROLLUP_STATUS_HINT =
  "状态由子计划自动汇总：子计划全部完成时自动完成；任一子计划进行中则显示进行中；子计划改回未开始时同步降级。请通过子计划更新进度。";

export function validateManualStatusChange(
  requestedStatus: PlanStatus,
  childStatuses: PlanStatus[],
): string | null {
  if (childStatuses.length === 0) return null;

  const active = childStatuses.filter((s) => s !== "archived");
  if (active.length === 0) return null;

  if (requestedStatus === "archived") {
    return "存在未归档的子计划，无法归档父计划";
  }

  const derived = deriveStatusFromDirectChildren(childStatuses);
  if (derived && requestedStatus === derived) return null;

  return "该计划有子计划，状态由子计划自动汇总，请通过子计划操作";
}

export function hasActiveSubplans(childStatuses: PlanStatus[]): boolean {
  return childStatuses.some((s) => s !== "archived");
}
