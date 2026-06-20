import type { PlanContribution } from "@prisma/client";
import { formatDateOnly, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { writeFeed } from "@/lib/services/feed";
import type { CreateContributionInput } from "@/lib/validations/contribution";

export function serializeContribution(c: PlanContribution & { plan?: { title: string } }) {
  return {
    id: c.id,
    planId: c.planId,
    planTitle: c.plan?.title,
    title: c.title,
    description: c.description,
    occurredOn: formatDateOnly(c.occurredOn) ?? "",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

async function assertLongTermPlan(userId: string, planId: string) {
  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId, status: { not: "archived" } },
  });
  if (!plan) throw new Error("计划不存在");
  if (plan.type !== "goal" && plan.type !== "phase") {
    throw new Error("仅可关联长期目标或阶段计划");
  }
  return plan;
}

export async function createContribution(userId: string, input: CreateContributionInput) {
  const plan = await assertLongTermPlan(userId, input.planId);

  const contribution = await prisma.planContribution.create({
    data: {
      userId,
      planId: input.planId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      occurredOn: parseDateOnly(input.occurredOn)!,
    },
    include: { plan: { select: { title: true } } },
  });

  await writeFeed({
    userId,
    itemType: "contribution",
    itemId: contribution.id,
    actionType: "create",
    content: `${contribution.title} · ${plan.title}`,
  });

  return contribution;
}

export async function updateContribution(
  userId: string,
  id: string,
  input: Partial<CreateContributionInput>,
) {
  const existing = await prisma.planContribution.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("NOT_FOUND");

  if (input.planId) await assertLongTermPlan(userId, input.planId);

  const contribution = await prisma.planContribution.update({
    where: { id },
    data: {
      ...(input.planId !== undefined && { planId: input.planId }),
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && {
        description: input.description?.trim() || null,
      }),
      ...(input.occurredOn !== undefined && {
        occurredOn: parseDateOnly(input.occurredOn)!,
      }),
    },
    include: { plan: { select: { title: true } } },
  });

  await writeFeed({
    userId,
    itemType: "contribution",
    itemId: contribution.id,
    actionType: "update",
    content: contribution.title,
  });

  return contribution;
}

export async function deleteContribution(userId: string, id: string) {
  const existing = await prisma.planContribution.findFirst({
    where: { id, userId },
    include: { plan: { select: { title: true } } },
  });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    await tx.planContribution.delete({ where: { id } });
    await writeFeed({
      userId,
      itemType: "contribution",
      itemId: id,
      actionType: "archive",
      content: existing.title,
    });
  });
}

export async function getContributionsInRange(
  userId: string,
  from?: string | null,
  to?: string | null,
) {
  const where: { userId: string; occurredOn?: { gte?: Date; lte?: Date } } = { userId };

  if (from) {
    where.occurredOn = { ...where.occurredOn, gte: parseDateOnly(from)! };
  }
  if (to) {
    where.occurredOn = { ...where.occurredOn, lte: parseDateOnly(to)! };
  }

  const rows = await prisma.planContribution.findMany({
    where,
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    include: { plan: { select: { title: true, type: true } } },
  });

  return rows.map(serializeContribution);
}
