import type { PlanStatus } from "@prisma/client";

export function applyStatusChangeToActualDates(args: {
  previousStatus: PlanStatus;
  nextStatus: PlanStatus;
  actualStart: Date | null;
  actualEnd: Date | null;
  explicitActualStart: boolean;
  explicitActualEnd: boolean;
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

  let nextActualStart = actualStart;
  let nextActualEnd = actualEnd;

  if (!explicitActualStart && nextStatus === "in_progress" && !nextActualStart) {
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
