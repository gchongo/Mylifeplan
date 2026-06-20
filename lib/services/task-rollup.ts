import type { TaskStatus } from "@prisma/client";

/** 展示层推导：父任务汇总状态（不写入数据库） */
export function deriveParentStatus(
  ownStatus: TaskStatus,
  childStatuses: TaskStatus[],
): TaskStatus {
  if (childStatuses.length === 0) return ownStatus;

  if (childStatuses.every((s) => s === "done")) return "done";
  if (
    childStatuses.some((s) => s === "in_progress") ||
    (childStatuses.some((s) => s === "done") &&
      childStatuses.some((s) => s !== "done"))
  ) {
    return "in_progress";
  }
  return "todo";
}
