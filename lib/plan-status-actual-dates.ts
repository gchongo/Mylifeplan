import type { PlanStatus } from "@prisma/client";

export function applyStatusChangeToActualDates(args: {
  previousStatus: PlanStatus;
  nextStatus: PlanStatus;
  actualStart: Date | null;
  actualEnd: Date | null;
  explicitActualStart: boolean;
  explicitActualEnd: boolean;
  /** @deprecated 未开始→已完成时实开固定为 now，不再使用计划开始日 */
  planStart?: Date | null;
  now?: Date;
}): { actualStart: Date | null; actualEnd: Date | null } {
  const {
    previousStatus,
    nextStatus,
    actualStart,
    actualEnd,
    explicitActualStart,
    explicitActualEnd,
    now = new Date(),
  } = args;

  if (
    nextStatus === "not_started" &&
    (previousStatus === "in_progress" || previousStatus === "done")
  ) {
    return { actualStart: null, actualEnd: null };
  }

  let nextActualStart = actualStart;
  let nextActualEnd = actualEnd;

  if (!explicitActualStart && nextStatus === "in_progress" && !nextActualStart) {
    nextActualStart = now;
  }

  if (!explicitActualStart && nextStatus === "done" && !nextActualStart) {
    nextActualStart = now;
  }

  if (
    !explicitActualEnd &&
    nextStatus === "in_progress" &&
    previousStatus === "done" &&
    nextActualEnd != null
  ) {
    nextActualEnd = null;
  }

  if (!explicitActualEnd && nextStatus === "done") {
    if (previousStatus === "in_progress" || nextActualEnd == null) {
      nextActualEnd = now;
    }
  }

  return { actualStart: nextActualStart, actualEnd: nextActualEnd };
}
