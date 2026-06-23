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

/** 手动修改实际起止时推导状态（与 applyStatusChangeToActualDates 对称） */
export function applyActualDateChangeToStatus(args: {
  previousStatus: PlanStatus;
  actualStart: Date | null;
  actualEnd: Date | null;
  previousActualStart: Date | null;
  previousActualEnd: Date | null;
  actualStartExplicit: boolean;
  actualEndExplicit: boolean;
  now?: Date;
}): { status: PlanStatus; actualStart: Date | null; actualEnd: Date | null } {
  const {
    previousStatus,
    previousActualStart,
    previousActualEnd,
    actualStartExplicit,
    actualEndExplicit,
    now = new Date(),
  } = args;

  let actualStart = args.actualStart;
  let actualEnd = args.actualEnd;

  if (previousStatus === "archived") {
    return { status: previousStatus, actualStart, actualEnd };
  }

  const startCleared =
    actualStartExplicit && actualStart == null && previousActualStart != null;
  const endCleared = actualEndExplicit && actualEnd == null && previousActualEnd != null;

  if (startCleared && !actualEnd) {
    return { status: "not_started", actualStart: null, actualEnd: null };
  }

  if (endCleared && previousStatus === "done") {
    return {
      status: actualStart ? "in_progress" : "not_started",
      actualStart,
      actualEnd: null,
    };
  }

  if (startCleared && actualEnd) {
    actualStart = actualEnd;
    return { status: "done", actualStart, actualEnd };
  }

  if (!actualStart && !actualEnd) {
    return { status: "not_started", actualStart: null, actualEnd: null };
  }

  if (actualEnd) {
    if (!actualStart) {
      actualStart = actualEnd;
    }
    return { status: "done", actualStart, actualEnd };
  }

  if (actualStart) {
    if (previousStatus === "done") {
      return { status: "done", actualStart, actualEnd: null };
    }
    return { status: "in_progress", actualStart, actualEnd: null };
  }

  return { status: previousStatus, actualStart, actualEnd };
}

/** 合并状态与实际时间的双向联动（叶子计划 PATCH 用） */
export function reconcilePlanStatusAndActualDates(args: {
  previousStatus: PlanStatus;
  requestedStatus?: PlanStatus;
  actualStart: Date | null;
  actualEnd: Date | null;
  previousActualStart: Date | null;
  previousActualEnd: Date | null;
  statusExplicit: boolean;
  actualStartExplicit: boolean;
  actualEndExplicit: boolean;
  now?: Date;
}): { status: PlanStatus; actualStart: Date | null; actualEnd: Date | null } {
  const {
    previousStatus,
    requestedStatus,
    actualStart,
    actualEnd,
    previousActualStart,
    previousActualEnd,
    statusExplicit,
    actualStartExplicit,
    actualEndExplicit,
    now,
  } = args;

  const nextRequestedStatus = requestedStatus ?? previousStatus;
  const statusExplicitlyChanged =
    statusExplicit && nextRequestedStatus !== previousStatus;

  if (statusExplicitlyChanged) {
    const dates = applyStatusChangeToActualDates({
      previousStatus,
      nextStatus: nextRequestedStatus,
      actualStart,
      actualEnd,
      explicitActualStart: actualStartExplicit,
      explicitActualEnd: actualEndExplicit,
      now,
    });
    return {
      status: nextRequestedStatus,
      actualStart: dates.actualStart,
      actualEnd: dates.actualEnd,
    };
  }

  if (actualStartExplicit || actualEndExplicit) {
    return applyActualDateChangeToStatus({
      previousStatus,
      actualStart,
      actualEnd,
      previousActualStart,
      previousActualEnd,
      actualStartExplicit,
      actualEndExplicit,
      now,
    });
  }

  return {
    status: previousStatus,
    actualStart,
    actualEnd,
  };
}

/** 新建计划：根据初始状态与实际时间对齐 */
export function resolveInitialPlanStatusAndActualDates(args: {
  requestedStatus?: PlanStatus;
  actualStart: Date | null;
  actualEnd: Date | null;
  actualStartExplicit: boolean;
  actualEndExplicit: boolean;
  now?: Date;
}): { status: PlanStatus; actualStart: Date | null; actualEnd: Date | null } {
  const {
    requestedStatus,
    actualStart,
    actualEnd,
    actualStartExplicit,
    actualEndExplicit,
    now,
  } = args;

  if (actualStartExplicit || actualEndExplicit) {
    return reconcilePlanStatusAndActualDates({
      previousStatus: "not_started",
      requestedStatus,
      actualStart,
      actualEnd,
      previousActualStart: null,
      previousActualEnd: null,
      statusExplicit: requestedStatus !== undefined,
      actualStartExplicit,
      actualEndExplicit,
      now,
    });
  }

  if (requestedStatus && requestedStatus !== "not_started") {
    const dates = applyStatusChangeToActualDates({
      previousStatus: "not_started",
      nextStatus: requestedStatus,
      actualStart: null,
      actualEnd: null,
      explicitActualStart: false,
      explicitActualEnd: false,
      now,
    });
    return {
      status: requestedStatus,
      actualStart: dates.actualStart,
      actualEnd: dates.actualEnd,
    };
  }

  return {
    status: requestedStatus ?? "not_started",
    actualStart,
    actualEnd,
  };
}
