import type { PlanContribution } from "@prisma/client";
import { formatDateOnly, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { writeFeed } from "@/lib/services/feed";
import type { CreateContributionInput } from "@/lib/validations/contribution";
import { findRootPlanId } from "@/lib/gantt-contribution-display";

export function contributionEndDate(
  c: Pick<PlanContribution, "occurredOn" | "occurredEndOn">,
): string {
  return formatDateOnly(c.occurredEndOn) ?? formatDateOnly(c.occurredOn) ?? "";
}

export function serializeContribution(c: PlanContribution & { plan?: { title: string } }) {
  return {
    id: c.id,
    planId: c.planId,
    planTitle: c.plan?.title,
    title: c.title,
    description: c.description,
    occurredOn: formatDateOnly(c.occurredOn) ?? "",
    occurredEndOn: formatDateOnly(c.occurredEndOn),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function contributionOverlapsRange(
  c: Pick<PlanContribution, "occurredOn" | "occurredEndOn">,
  from: Date | null,
  to: Date | null,
): boolean {
  const start = c.occurredOn;
  const end = c.occurredEndOn ?? c.occurredOn;
  if (from && end < from) return false;
  if (to && start > to) return false;
  return true;
}

async function assertPlanForContribution(userId: string, planId: string) {
  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId, status: { not: "archived" } },
  });
  if (!plan) throw new Error("计划不存在");
  return plan;
}

async function validateContributionPlanReassignment(
  userId: string,
  fromPlanId: string,
  toPlanId: string,
): Promise<string | null> {
  if (fromPlanId === toPlanId) return null;

  const plans = await prisma.plan.findMany({
    where: { userId, status: { not: "archived" } },
    select: { id: true, parentPlanId: true },
  });
  const byId = new Map(
    plans.map((p) => [p.id, { id: p.id, parentId: p.parentPlanId }]),
  );
  if (!byId.has(fromPlanId) || !byId.has(toPlanId)) {
    return "计划不存在";
  }
  const rootA = findRootPlanId(fromPlanId, byId);
  const rootB = findRootPlanId(toPlanId, byId);
  if (rootA !== rootB) {
    return "贡献记录只能改绑到同一计划树内的子计划";
  }
  return null;
}

export async function createContribution(userId: string, input: CreateContributionInput) {
  const plan = await assertPlanForContribution(userId, input.planId);
  const endStr = input.occurredEndOn?.trim() || null;

  const contribution = await prisma.planContribution.create({
    data: {
      userId,
      planId: input.planId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      occurredOn: parseDateOnly(input.occurredOn)!,
      occurredEndOn: endStr ? parseDateOnly(endStr) : null,
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

  if (input.planId) await assertPlanForContribution(userId, input.planId);

  if (input.planId && input.planId !== existing.planId) {
    const subtreeError = await validateContributionPlanReassignment(
      userId,
      existing.planId,
      input.planId,
    );
    if (subtreeError) throw new Error(subtreeError);
  }

  const endStr =
    input.occurredEndOn !== undefined
      ? input.occurredEndOn?.trim() || null
      : undefined;

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
      ...(endStr !== undefined && {
        occurredEndOn: endStr ? parseDateOnly(endStr) : null,
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
  const fromDate = from ? parseDateOnly(from) : null;
  const toDate = to ? parseDateOnly(to) : null;

  const rows = await prisma.planContribution.findMany({
    where: { userId },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    include: { plan: { select: { title: true, type: true } } },
  });

  return rows
    .filter((c) => contributionOverlapsRange(c, fromDate, toDate))
    .map(serializeContribution);
}
