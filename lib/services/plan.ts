import type { Plan, PlanStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { isPlanUnscheduled, shouldShowInMemo, validateDateFields, getEffectiveEndDate } from "@/lib/content-router";
import { UNSCHEDULED_BLOCKED_HINT } from "@/lib/kanban-board";
import { parsePlanDateTime, formatPlanDateTime, formatDateOnly, toDatetimeLocalInput, parsePlanStartDateTime, parsePlanEndDateTime } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { writeFeed } from "@/lib/services/feed";
import { deleteMemoForPlan, syncMemoForPlan } from "@/lib/services/memo-sync";
import {
  deriveStatusFromDirectChildren,
  validateManualStatusChange,
} from "@/lib/services/plan-rollup";
import { isPlanStartBeforeParent } from "@/lib/gantt-plan-bind";
import {
  reconcilePlanStatusAndActualDates,
  resolveInitialPlanStatusAndActualDates,
} from "@/lib/plan-status-actual-dates";
import { aggregateParentActualDates } from "@/lib/plan-actual-rollup";
import type { createPlanSchema } from "@/lib/validations/plan";
import type { z } from "zod";

type Tx = Prisma.TransactionClient;
type CreatePlanInput = z.infer<typeof createPlanSchema>;
type UpdatePlanInput = Partial<CreatePlanInput>;

async function getPlanDepth(planId: string, userId: string): Promise<number> {
  let depth = 1;
  let current: { parentPlanId: string | null } | null = await prisma.plan.findFirst({
    where: { id: planId, userId },
    select: { parentPlanId: true },
  });
  while (current?.parentPlanId) {
    depth++;
    current = await prisma.plan.findFirst({
      where: { id: current.parentPlanId, userId },
      select: { parentPlanId: true },
    });
  }
  return depth;
}

function feedActionForPlan(
  prev: Plan["status"],
  next: Plan["status"],
): "archive" | "complete" | "update" {
  if (next === "archived" && prev !== "archived") return "archive";
  if (next === "done" && prev !== "done") return "complete";
  return "update";
}

async function validatePlanHierarchy(
  userId: string,
  parentPlanId: string | null | undefined,
  planId?: string,
): Promise<string | null> {
  if (!parentPlanId) return null;
  if (planId && parentPlanId === planId) return "不能将自己设为父计划";

  const parent = await prisma.plan.findFirst({ where: { id: parentPlanId, userId } });
  if (!parent) return "父计划不存在";

  const parentDepth = await getPlanDepth(parentPlanId, userId);
  if (parentDepth >= 3) return "计划层级最多 3 层";

  if (planId) {
    let cur: string | null = parentPlanId;
    while (cur) {
      if (cur === planId) return "不能形成循环层级";
      const row: { parentPlanId: string | null } | null = await prisma.plan.findFirst({
        where: { id: cur, userId },
        select: { parentPlanId: true },
      });
      cur = row?.parentPlanId ?? null;
    }
  }

  return null;
}

function validateDates(startDate: string | null | undefined, endDate: string | null | undefined) {
  return validateDateFields({
    startDate: startDate ?? undefined,
    dueDate: endDate ?? undefined,
  });
}

async function validatePlanStartAfterParent(
  userId: string,
  parentPlanId: string | null | undefined,
  startDate: Date | null,
): Promise<string | null> {
  if (!parentPlanId || !startDate) return null;
  const parent = await prisma.plan.findFirst({
    where: { id: parentPlanId, userId },
    select: { startDate: true },
  });
  if (!parent?.startDate) return null;
  if (isPlanStartBeforeParent(startDate, parent.startDate)) {
    return "子计划开始时间不能早于父计划";
  }
  return null;
}

async function collectDescendantPlanIds(
  tx: Tx,
  userId: string,
  planId: string,
): Promise<string[]> {
  const ids: string[] = [];
  let frontier = [planId];
  while (frontier.length > 0) {
    const children = await tx.plan.findMany({
      where: { parentPlanId: { in: frontier }, userId },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);
    ids.push(...childIds);
    frontier = childIds;
  }
  return ids;
}

function shiftDateByMs(value: Date | null, deltaMs: number): Date | null {
  if (!value) return null;
  return new Date(value.getTime() + deltaMs);
}

async function shiftDescendantPlanDates(
  tx: Tx,
  userId: string,
  planId: string,
  deltaMs: number,
): Promise<void> {
  if (deltaMs === 0) return;
  const descendantIds = await collectDescendantPlanIds(tx, userId, planId);
  for (const id of descendantIds) {
    const child = await tx.plan.findFirst({ where: { id, userId } });
    if (!child) continue;
    const updated = await tx.plan.update({
      where: { id },
      data: {
        startDate: shiftDateByMs(child.startDate, deltaMs),
        endDate: shiftDateByMs(child.endDate, deltaMs),
      },
    });
    await syncMemoForPlan(updated, tx);
  }
}

async function validatePlanCoversContributions(
  userId: string,
  planId: string,
  startDate: Date | null,
  endDate: Date | null,
): Promise<string | null> {
  const rows = await prisma.planContribution.findMany({
    where: { planId, userId },
    select: { occurredOn: true, occurredEndOn: true },
  });
  if (rows.length === 0 || !startDate) return null;

  const startStr = formatDateOnly(startDate)!;
  const endStr = endDate
    ? formatDateOnly(endDate)!
    : getEffectiveEndDate({
        startDate: startStr,
        dueDate: null,
      }).effectiveEnd;

  if (!endStr) return null;

  for (const row of rows) {
    const cStart = row.occurredOn.getTime();
    const cEnd = (row.occurredEndOn ?? row.occurredOn).getTime();
    const planStart = startDate.getTime();
    const planEndMs = endDate
      ? endDate.getTime()
      : parsePlanDateTime(
          getEffectiveEndDate({
            startDate: startStr,
            dueDate: null,
          }).effectiveEnd ?? "",
        )?.getTime();
    if (planEndMs == null) return null;
    if (cStart < planStart || cEnd > planEndMs) {
      return "计划时间需覆盖全部贡献记录，请调整开始或结束时间";
    }
  }
  return null;
}

async function applyPlanStatusIfChanged(
  userId: string,
  planId: string,
  prevStatus: PlanStatus,
  nextStatus: PlanStatus,
  tx: Tx,
  planTitle: string,
) {
  if (prevStatus === nextStatus) return;

  await writeFeed({
    userId,
    itemType: "plan",
    itemId: planId,
    actionType: feedActionForPlan(prevStatus, nextStatus),
    content: planTitle,
  });
}

async function rollupParentPlan(userId: string, parentPlanId: string | null, tx: Tx) {
  if (!parentPlanId) return;

  const parent = await tx.plan.findFirst({ where: { id: parentPlanId, userId } });
  if (!parent) return;

  const children = await tx.plan.findMany({
    where: { parentPlanId: parent.id, userId },
    select: {
      status: true,
      actualStartDate: true,
      actualEndDate: true,
      startDate: true,
      endDate: true,
    },
  });
  const nextStatus = deriveStatusFromDirectChildren(children.map((c) => c.status));
  if (!nextStatus) return;

  const aggregated = aggregateParentActualDates(children);
  const nextActualStart =
    nextStatus === "not_started" ? null : aggregated.actualStartDate;
  const nextActualEnd = nextStatus === "done" ? aggregated.actualEndDate : null;

  const statusChanged = nextStatus !== parent.status;
  const startChanged =
    (nextActualStart?.getTime() ?? null) !== (parent.actualStartDate?.getTime() ?? null);
  const endChanged =
    (nextActualEnd?.getTime() ?? null) !== (parent.actualEndDate?.getTime() ?? null);

  if (!statusChanged && !startChanged && !endChanged) return;

  const updated = await tx.plan.update({
    where: { id: parent.id },
    data: {
      ...(statusChanged && { status: nextStatus }),
      ...(startChanged && { actualStartDate: nextActualStart }),
      ...(endChanged && { actualEndDate: nextActualEnd }),
    },
  });
  await syncMemoForPlan(updated, tx);
  if (statusChanged) {
    await applyPlanStatusIfChanged(
      userId,
      parent.id,
      parent.status,
      nextStatus,
      tx,
      updated.title,
    );
  }
  await rollupParentPlan(userId, parent.parentPlanId, tx);
}

export async function createPlan(userId: string, input: CreatePlanInput): Promise<Plan> {
  const dateError = validateDates(input.startDate, input.endDate);
  if (dateError) throw new Error(dateError);

  const hierarchyError = await validatePlanHierarchy(userId, input.parentPlanId);
  if (hierarchyError) throw new Error(hierarchyError);

  const parsedStart = parsePlanStartDateTime(input.startDate);
  const parentStartError = await validatePlanStartAfterParent(
    userId,
    input.parentPlanId,
    parsedStart,
  );
  if (parentStartError) throw new Error(parentStartError);

  const initialActualStart = parsePlanStartDateTime(input.actualStartDate);
  const initialActualEnd = parsePlanEndDateTime(input.actualEndDate);
  const initialActualStartExplicit = input.actualStartDate != null && input.actualStartDate !== "";
  const initialActualEndExplicit = input.actualEndDate != null && input.actualEndDate !== "";
  const initialResolved = resolveInitialPlanStatusAndActualDates({
    requestedStatus: input.status,
    actualStart: initialActualStart,
    actualEnd: initialActualEnd,
    actualStartExplicit: initialActualStartExplicit,
    actualEndExplicit: initialActualEndExplicit,
  });

  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        type: input.type ?? "goal",
        parentPlanId: input.parentPlanId || null,
        startDate: parsePlanStartDateTime(input.startDate),
        endDate: parsePlanEndDateTime(input.endDate),
        actualStartDate: initialResolved.actualStart,
        actualEndDate: initialResolved.actualEnd,
        status: initialResolved.status,
        priority: input.priority ?? null,
        color: input.color ?? null,
      },
    });

    await syncMemoForPlan(plan, tx);
    await writeFeed({
      userId,
      itemType: "plan",
      itemId: plan.id,
      actionType: "create",
      content: plan.title,
    });

    return plan;
  });
}

export async function updatePlan(
  userId: string,
  planId: string,
  input: UpdatePlanInput,
): Promise<Plan> {
  const existing = await prisma.plan.findFirst({ where: { id: planId, userId } });
  if (!existing) throw new Error("NOT_FOUND");

  const parentPlanId =
    input.parentPlanId !== undefined ? input.parentPlanId : existing.parentPlanId;

  const hierarchyError = await validatePlanHierarchy(userId, parentPlanId, planId);
  if (hierarchyError) throw new Error(hierarchyError);

  const startStr =
    input.startDate !== undefined
      ? input.startDate
      : existing.startDate
        ? toDatetimeLocalInput(existing.startDate)
        : undefined;
  const endStr =
    input.endDate !== undefined
      ? input.endDate
      : existing.endDate
        ? toDatetimeLocalInput(existing.endDate)
        : undefined;

  const dateError = validateDates(startStr, endStr);
  if (dateError) throw new Error(dateError);

  const nextStart =
    input.startDate !== undefined ? input.startDate || null : existing.startDate;
  const nextEnd = input.endDate !== undefined ? input.endDate || null : existing.endDate;
  const wasScheduled = !isPlanUnscheduled({
    startDate: existing.startDate,
    endDate: existing.endDate,
  });
  const wouldBeUnscheduled = isPlanUnscheduled({ startDate: nextStart, endDate: nextEnd });
  if (wasScheduled && wouldBeUnscheduled) {
    const contributionCount = await prisma.planContribution.count({
      where: { planId, userId },
    });
    if (contributionCount > 0) {
      throw new Error(UNSCHEDULED_BLOCKED_HINT);
    }
  }

  if (input.status !== undefined) {
    const children = await prisma.plan.findMany({
      where: { parentPlanId: planId, userId },
      select: { status: true },
    });
    const rollupError = validateManualStatusChange(
      input.status,
      children.map((c) => c.status),
    );
    if (rollupError) throw new Error(rollupError);
  }

  const parsedNextStart =
    input.startDate !== undefined ? parsePlanStartDateTime(input.startDate) : existing.startDate;
  const parentStartError = await validatePlanStartAfterParent(
    userId,
    parentPlanId,
    parsedNextStart,
  );
  if (parentStartError) throw new Error(parentStartError);

  const nextStartDate =
    input.startDate !== undefined ? parsePlanStartDateTime(input.startDate) : existing.startDate;
  const nextEndDate =
    input.endDate !== undefined ? parsePlanEndDateTime(input.endDate) : existing.endDate;

  const subPlanCount = await prisma.plan.count({
    where: { parentPlanId: planId, userId },
  });
  const hasSubPlans = subPlanCount > 0;

  let nextActualStart =
    input.actualStartDate !== undefined
      ? parsePlanStartDateTime(input.actualStartDate)
      : existing.actualStartDate;
  let nextActualEnd =
    input.actualEndDate !== undefined
      ? parsePlanEndDateTime(input.actualEndDate)
      : existing.actualEndDate;

  let nextStatus = input.status ?? existing.status;

  if (!hasSubPlans) {
    const reconciled = reconcilePlanStatusAndActualDates({
      previousStatus: existing.status,
      requestedStatus: input.status,
      actualStart: nextActualStart,
      actualEnd: nextActualEnd,
      previousActualStart: existing.actualStartDate,
      previousActualEnd: existing.actualEndDate,
      statusExplicit: input.status !== undefined,
      actualStartExplicit: input.actualStartDate !== undefined,
      actualEndExplicit: input.actualEndDate !== undefined,
    });
    nextStatus = reconciled.status;
    nextActualStart = reconciled.actualStart;
    nextActualEnd = reconciled.actualEnd;
  }

  const actualStartChanged =
    (nextActualStart?.getTime() ?? null) !== (existing.actualStartDate?.getTime() ?? null);
  const actualEndChanged =
    (nextActualEnd?.getTime() ?? null) !== (existing.actualEndDate?.getTime() ?? null);
  const statusChanged = nextStatus !== existing.status;

  if (input.startDate !== undefined || input.endDate !== undefined) {
    const contribError = await validatePlanCoversContributions(
      userId,
      planId,
      nextStartDate,
      nextEndDate,
    );
    if (contribError) throw new Error(contribError);
  }

  const startDeltaMs =
    input.startDate !== undefined && existing.startDate && parsedNextStart
      ? parsedNextStart.getTime() - existing.startDate.getTime()
      : 0;
  const shouldShiftDescendants = input.shiftDescendants === true;

  const prevParentId = existing.parentPlanId;

  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.update({
      where: { id: planId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && {
          description: input.description?.trim() || null,
        }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.parentPlanId !== undefined && { parentPlanId: input.parentPlanId || null }),
        ...(input.startDate !== undefined && { startDate: parsePlanStartDateTime(input.startDate) }),
        ...(input.endDate !== undefined && { endDate: parsePlanEndDateTime(input.endDate) }),
        ...(!hasSubPlans && actualStartChanged ? { actualStartDate: nextActualStart } : {}),
        ...(!hasSubPlans && actualEndChanged ? { actualEndDate: nextActualEnd } : {}),
        ...(statusChanged && { status: nextStatus }),
        ...(input.priority !== undefined && { priority: input.priority ?? null }),
        ...(input.color !== undefined && { color: input.color ?? null }),
      },
    });

    await syncMemoForPlan(plan, tx);

    if (startDeltaMs !== 0 && shouldShiftDescendants) {
      await shiftDescendantPlanDates(tx, userId, planId, startDeltaMs);
    }

    if (statusChanged) {
      await applyPlanStatusIfChanged(
        userId,
        planId,
        existing.status,
        plan.status,
        tx,
        plan.title,
      );
    } else {
      await writeFeed({
        userId,
        itemType: "plan",
        itemId: plan.id,
        actionType: "update",
        content: plan.title,
      });
    }

    await rollupParentPlan(userId, plan.parentPlanId, tx);
    if (prevParentId && prevParentId !== plan.parentPlanId) {
      await rollupParentPlan(userId, prevParentId, tx);
    }

    return plan;
  });
}

export async function deletePlan(userId: string, planId: string) {
  const existing = await prisma.plan.findFirst({ where: { id: planId, userId } });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    await deleteMemoForPlan(planId, tx);
    await tx.plan.delete({ where: { id: planId } });
  });
}

export function serializePlan(plan: Plan) {
  return {
    ...plan,
    startDate: formatPlanDateTime(plan.startDate),
    endDate: formatPlanDateTime(plan.endDate),
    actualStartDate: formatPlanDateTime(plan.actualStartDate),
    actualEndDate: formatPlanDateTime(plan.actualEndDate),
  };
}
