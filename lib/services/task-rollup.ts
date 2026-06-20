import type { TaskStatus } from "@prisma/client";

/** 仅根据直接子任务状态推导（同级子任务互不影响，只看各自父节点） */
export function deriveStatusFromDirectChildren(
  childStatuses: TaskStatus[],
): TaskStatus | null {
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
  return "todo";
}

/** 展示层推导：有子任务时以子任务汇总为准，否则用自身状态 */
export function deriveParentStatus(
  ownStatus: TaskStatus,
  childStatuses: TaskStatus[],
): TaskStatus {
  return deriveStatusFromDirectChildren(childStatuses) ?? ownStatus;
}

export const ROLLUP_STATUS_HINT =
  "状态由子任务自动汇总：子任务全部完成时自动完成；任一子任务进行中则显示进行中；子任务改回待办时同步降级。请通过子任务更新进度。";

/** 有未归档子任务时，禁止手动改 todo / in_progress / done / 归档 */
export function validateManualStatusChange(
  requestedStatus: TaskStatus,
  childStatuses: TaskStatus[],
): string | null {
  if (childStatuses.length === 0) return null;

  const active = childStatuses.filter((s) => s !== "archived");
  if (active.length === 0) return null;

  if (requestedStatus === "archived") {
    return "存在未归档的子任务，无法归档父任务";
  }

  const derived = deriveStatusFromDirectChildren(childStatuses);
  if (derived && requestedStatus === derived) return null;

  return "该任务有子任务，状态由子任务自动汇总，请通过子任务操作";
}

export function hasActiveSubtasks(childStatuses: TaskStatus[]): boolean {
  return childStatuses.some((s) => s !== "archived");
}

