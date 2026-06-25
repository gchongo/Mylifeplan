import type { PlanContribution, ContributionImage } from "@prisma/client";
import { parseDateOnly, parsePlanDateTime, parsePlanEndDateTime, formatPlanDateTime, toDatetimeLocalInput, datePartOf } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { normalizePlanColor } from "@/lib/plan-color";
import { writeFeed } from "@/lib/services/feed";
import type { CreateContributionInput } from "@/lib/validations/contribution";
import { findRootPlanId } from "@/lib/gantt-contribution-display";

type ContributionWithRelations = PlanContribution & {
  plan?: { title: string; type?: string; id?: string };
  images?: ContributionImage[];
};

export function contributionEndDate(
  c: Pick<PlanContribution, "occurredOn" | "occurredEndOn">,
): string {
  return datePartOf(c.occurredEndOn) ?? datePartOf(c.occurredOn) ?? "";
}

export function serializeContribution(c: ContributionWithRelations) {
  return {
    id: c.id,
    planId: c.planId,
    planTitle: c.plan?.title,
    title: c.title,
    description: c.description,
    body: c.body,
    imageUrls: c.images?.map((img) => img.url) ?? [],
    occurredOn: toDatetimeLocalInput(c.occurredOn) || formatPlanDateTime(c.occurredOn) || "",
    occurredEndOn: c.occurredEndOn ? toDatetimeLocalInput(c.occurredEndOn) : null,
    markerColor: c.markerColor ? normalizePlanColor(c.markerColor) : null,
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

async function collectDescendantPlanIds(userId: string, planId: string): Promise<string[]> {
  const ids: string[] = [];
  let frontier = [planId];
  while (frontier.length > 0) {
    const children = await prisma.plan.findMany({
      where: { parentPlanId: { in: frontier }, userId },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);
    ids.push(...childIds);
    frontier = childIds;
  }
  return ids;
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

async function syncContributionImages(
  contributionId: string,
  imageUrls: string[] | undefined,
  tx: Pick<typeof prisma, "contributionImage"> = prisma,
) {
  if (imageUrls === undefined) return;
  await tx.contributionImage.deleteMany({ where: { contributionId } });
  if (imageUrls.length > 0) {
    await tx.contributionImage.createMany({
      data: imageUrls.map((url) => ({ contributionId, url })),
    });
  }
}

export async function createContribution(userId: string, input: CreateContributionInput) {
  const plan = await assertPlanForContribution(userId, input.planId);
  const endStr = input.occurredEndOn?.trim() || null;
  const body = input.body?.trim() || null;

  const contribution = await prisma.$transaction(async (tx) => {
    const row = await tx.planContribution.create({
      data: {
        userId,
        planId: input.planId,
        title: input.title.trim(),
        description: input.description?.trim() || body?.slice(0, 500) || null,
        body,
        occurredOn: parsePlanDateTime(input.occurredOn)!,
        occurredEndOn: endStr ? parsePlanEndDateTime(endStr) : null,
        markerColor: input.markerColor ? normalizePlanColor(input.markerColor) : null,
      },
      include: { plan: { select: { title: true } }, images: true },
    });
    await syncContributionImages(row.id, input.imageUrls, tx);
    return tx.planContribution.findFirstOrThrow({
      where: { id: row.id },
      include: { plan: { select: { title: true } }, images: true },
    });
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

  const body =
    input.body !== undefined ? input.body?.trim() || null : undefined;

  const contribution = await prisma.$transaction(async (tx) => {
    const row = await tx.planContribution.update({
      where: { id },
      data: {
        ...(input.planId !== undefined && { planId: input.planId }),
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && {
          description: input.description?.trim() || null,
        }),
        ...(body !== undefined && {
          body,
          ...(input.description === undefined && {
            description: body?.slice(0, 500) || null,
          }),
        }),
        ...(input.occurredOn !== undefined && {
          occurredOn: parsePlanDateTime(input.occurredOn)!,
        }),
        ...(endStr !== undefined && {
          occurredEndOn: endStr ? parsePlanEndDateTime(endStr) : null,
        }),
        ...(input.markerColor !== undefined && {
          markerColor: input.markerColor ? normalizePlanColor(input.markerColor) : null,
        }),
      },
      include: { plan: { select: { title: true } }, images: true },
    });
    await syncContributionImages(row.id, input.imageUrls, tx);
    return tx.planContribution.findFirstOrThrow({
      where: { id: row.id },
      include: { plan: { select: { title: true } }, images: true },
    });
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

export async function getContributionById(userId: string, id: string) {
  return prisma.planContribution.findFirst({
    where: { id, userId },
    include: {
      plan: { select: { id: true, title: true, type: true } },
      images: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getContributionsInRange(
  userId: string,
  from?: string | null,
  to?: string | null,
  planIds?: string[] | null,
  options?: { includeImages?: boolean },
) {
  const fromDate = from ? parseDateOnly(from) : null;
  const toDate = to ? parseDateOnly(to) : null;
  const includeImages = options?.includeImages ?? true;

  const rows = await prisma.planContribution.findMany({
    where: {
      userId,
      ...(planIds?.length ? { planId: { in: planIds } } : {}),
    },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    include: {
      plan: { select: { title: true, type: true } },
      ...(includeImages
        ? { images: { orderBy: { createdAt: "asc" } } }
        : {}),
    },
  });

  return rows
    .filter((c) => contributionOverlapsRange(c, fromDate, toDate))
    .map((c) => serializeContribution(c));
}

export async function getContributionsForPlanTree(userId: string, planId: string) {
  const descendantIds = await collectDescendantPlanIds(userId, planId);
  const planIds = [planId, ...descendantIds];
  const rows = await prisma.planContribution.findMany({
    where: { userId, planId: { in: planIds } },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    include: {
      plan: { select: { title: true, type: true } },
      images: { orderBy: { createdAt: "asc" } },
    },
  });
  return rows.map(serializeContribution);
}
