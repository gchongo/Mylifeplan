import type { Plan, PlanStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { shouldShowInMemo, validateDateFields } from "@/lib/content-router";
import { UNSCHEDULED_BLOCKED_HINT } from "@/lib/kanban-board";
import { parsePlanDateTime, formatPlanDateTime, toDatetimeLocalInput } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { writeFeed } from "@/lib/services/feed";
import { deleteMemoForPlan, syncMemoForPlan } from "@/lib/services/memo-sync";
import {
  deriveStatusFromDirectChildren,
  validateManualStatusChange,
} from "@/lib/services/plan-rollup";
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

async function applyPlanStatusIfChanged(
  userId: string,
  planId: string,
  prevStatus: PlanStatus,
  nextStatus: PlanStatus,
  tx: Tx,
) {
  if (prevStatus === nextStatus) return;

  await writeFeed({
    userId,
    itemType: "plan",
    itemId: planId,
    actionType: feedActionForPlan(prevStatus, nextStatus),
    content: undefined,
  });
}

async function rollupParentPlan(userId: string, parentPlanId: string | null, tx: Tx) {
  if (!parentPlanId) return;

  const parent = await tx.plan.findFirst({ where: { id: parentPlanId, userId } });
  if (!parent) return;

  const children = await tx.plan.findMany({
    where: { parentPlanId: parent.id, userId },
    select: { status: true },
  });
  const nextStatus = deriveStatusFromDirectChildren(children.map((c) => c.status));
  if (!nextStatus || nextStatus === parent.status) return;

  const updated = await tx.plan.update({
    where: { id: parent.id },
    data: { status: nextStatus },
  });
  await syncMemoForPlan(updated, tx);
  await applyPlanStatusIfChanged(userId, parent.id, parent.status, nextStatus, tx);
  await rollupParentPlan(userId, parent.parentPlanId, tx);
}

export async function createPlan(userId: string, input: CreatePlanInput): Promise<Plan> {
  const dateError = validateDates(input.startDate, input.endDate);
  if (dateError) throw new Error(dateError);

  const hierarchyError = await validatePlanHierarchy(userId, input.parentPlanId);
  if (hierarchyError) throw new Error(hierarchyError);

  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        type: input.type ?? "goal",
        parentPlanId: input.parentPlanId || null,
        startDate: parsePlanDateTime(input.startDate),
        endDate: parsePlanDateTime(input.endDate),
        status: input.status ?? "not_started",
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
  const wasScheduled = !shouldShowInMemo({
    startDate: existing.startDate,
    endDate: existing.endDate,
  });
  const wouldBeUnscheduled = shouldShowInMemo({ startDate: nextStart, endDate: nextEnd });
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
        ...(input.startDate !== undefined && { startDate: parsePlanDateTime(input.startDate) }),
        ...(input.endDate !== undefined && { endDate: parsePlanDateTime(input.endDate) }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.priority !== undefined && { priority: input.priority ?? null }),
        ...(input.color !== undefined && { color: input.color ?? null }),
      },
    });

    await syncMemoForPlan(plan, tx);

    if (input.status !== undefined && input.status !== existing.status) {
      await applyPlanStatusIfChanged(userId, planId, existing.status, plan.status, tx);
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
  };
}
