import type { Plan, PlanType } from "@prisma/client";
import { validateDateFields } from "@/lib/content-router";
import { parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { writeFeed } from "@/lib/services/feed";
import { deleteMemoForPlan, syncMemoForPlan } from "@/lib/services/memo-sync";
import type { createPlanSchema } from "@/lib/validations/plan";
import type { z } from "zod";

type CreatePlanInput = z.infer<typeof createPlanSchema>;
type UpdatePlanInput = Partial<CreatePlanInput>;

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
  type: PlanType,
  parentPlanId: string | null | undefined,
): Promise<string | null> {
  if (type === "goal") {
    if (parentPlanId) return "长期目标不能有父计划";
    return null;
  }

  if (type === "phase") {
    if (!parentPlanId) return "阶段计划必须关联一个长期目标";
    const parent = await prisma.plan.findFirst({ where: { id: parentPlanId, userId } });
    if (!parent) return "父计划不存在";
    if (parent.type !== "goal") return "阶段计划的父级必须是长期目标";
    return null;
  }

  if (!parentPlanId) return null;

  const parent = await prisma.plan.findFirst({ where: { id: parentPlanId, userId } });
  if (!parent) return "父计划不存在";
  if (parent.type !== "phase") return "短期计划的父级必须是阶段计划";
  return null;
}

function validateDates(startDate: string | null | undefined, endDate: string | null | undefined) {
  return validateDateFields({
    startDate: startDate ?? undefined,
    dueDate: endDate ?? undefined,
  });
}

export async function createPlan(userId: string, input: CreatePlanInput): Promise<Plan> {
  const dateError = validateDates(input.startDate, input.endDate);
  if (dateError) throw new Error(dateError);

  const hierarchyError = await validatePlanHierarchy(userId, input.type, input.parentPlanId);
  if (hierarchyError) throw new Error(hierarchyError);

  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        type: input.type,
        parentPlanId: input.parentPlanId || null,
        startDate: parseDateOnly(input.startDate),
        endDate: parseDateOnly(input.endDate),
        status: input.status ?? "not_started",
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

  const type = input.type ?? existing.type;
  const parentPlanId =
    input.parentPlanId !== undefined ? input.parentPlanId : existing.parentPlanId;

  const hierarchyError = await validatePlanHierarchy(userId, type, parentPlanId);
  if (hierarchyError) throw new Error(hierarchyError);

  const startStr =
    input.startDate !== undefined
      ? input.startDate
      : existing.startDate?.toISOString().slice(0, 10);
  const endStr =
    input.endDate !== undefined ? input.endDate : existing.endDate?.toISOString().slice(0, 10);

  const dateError = validateDates(startStr, endStr);
  if (dateError) throw new Error(dateError);

  const newStatus = input.status ?? existing.status;
  const actionType = feedActionForPlan(existing.status, newStatus);

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
        ...(input.startDate !== undefined && { startDate: parseDateOnly(input.startDate) }),
        ...(input.endDate !== undefined && { endDate: parseDateOnly(input.endDate) }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });

    await syncMemoForPlan(plan, tx);
    await writeFeed({
      userId,
      itemType: "plan",
      itemId: plan.id,
      actionType,
      content: plan.title,
    });

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
    startDate: plan.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: plan.endDate?.toISOString().slice(0, 10) ?? null,
  };
}
