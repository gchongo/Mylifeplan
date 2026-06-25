import type { BillingPlan, Subscription } from "@prisma/client";
import { prisma } from "@/lib/db";

export const DEFAULT_BILLING_PLANS = {
  free: {
    slug: "free",
    nameZh: "免费版",
    nameEn: "Free",
    maxPlans: 10,
    maxStorageBytes: 15 * 1024 * 1024,
    maxFileBytes: 5 * 1024 * 1024,
    sortOrder: 0,
  },
  pro: {
    slug: "pro",
    nameZh: "专业版",
    nameEn: "Pro",
    maxPlans: null as number | null,
    maxStorageBytes: 500 * 1024 * 1024,
    maxFileBytes: 20 * 1024 * 1024,
    sortOrder: 1,
  },
} as const;

export function serializeBillingPlan(plan: BillingPlan) {
  return {
    id: plan.id,
    slug: plan.slug,
    nameZh: plan.nameZh,
    nameEn: plan.nameEn,
    maxPlans: plan.maxPlans,
    maxStorageBytes: plan.maxStorageBytes,
    maxFileBytes: plan.maxFileBytes,
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export async function seedBillingPlans() {
  for (const def of Object.values(DEFAULT_BILLING_PLANS)) {
    await prisma.billingPlan.upsert({
      where: { slug: def.slug },
      update: {
        nameZh: def.nameZh,
        nameEn: def.nameEn,
        maxStorageBytes: def.maxStorageBytes,
        maxFileBytes: def.maxFileBytes,
        sortOrder: def.sortOrder,
      },
      create: {
        slug: def.slug,
        nameZh: def.nameZh,
        nameEn: def.nameEn,
        maxPlans: def.maxPlans,
        maxStorageBytes: def.maxStorageBytes,
        maxFileBytes: def.maxFileBytes,
        sortOrder: def.sortOrder,
        isActive: true,
      },
    });
  }
}

export async function listBillingPlans() {
  const plans = await prisma.billingPlan.findMany({ orderBy: { sortOrder: "asc" } });
  return plans.map(serializeBillingPlan);
}

export async function getBillingPlanBySlug(slug: string) {
  return prisma.billingPlan.findUnique({ where: { slug } });
}

export interface BillingPlanPatchInput {
  nameZh?: string;
  nameEn?: string;
  maxPlans?: number | null;
  maxStorageBytes?: number;
  maxFileBytes?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export async function updateBillingPlan(planId: string, input: BillingPlanPatchInput) {
  const existing = await prisma.billingPlan.findUnique({ where: { id: planId } });
  if (!existing) throw new Error("NOT_FOUND");

  const updated = await prisma.billingPlan.update({
    where: { id: planId },
    data: {
      ...(input.nameZh !== undefined && { nameZh: input.nameZh }),
      ...(input.nameEn !== undefined && { nameEn: input.nameEn }),
      ...(input.maxPlans !== undefined && { maxPlans: input.maxPlans }),
      ...(input.maxStorageBytes !== undefined && { maxStorageBytes: input.maxStorageBytes }),
      ...(input.maxFileBytes !== undefined && { maxFileBytes: input.maxFileBytes }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  });

  if (input.nameZh !== undefined) {
    await prisma.subscription.updateMany({
      where: { billingPlanId: planId },
      data: { planName: input.nameZh },
    });
  }

  return serializeBillingPlan(updated);
}

export async function ensureUserStorage(userId: string) {
  return prisma.userStorage.upsert({
    where: { userId },
    create: { userId, usedBytes: 0 },
    update: {},
  });
}

export async function addUserStorageBytes(userId: string, delta: number) {
  await ensureUserStorage(userId);
  return prisma.userStorage.update({
    where: { userId },
    data: { usedBytes: { increment: delta } },
  });
}

export async function getUserStorageUsedBytes(userId: string): Promise<number> {
  const row = await prisma.userStorage.findUnique({ where: { userId } });
  return row?.usedBytes ?? 0;
}

export async function provisionNewUserBilling(userId: string) {
  await seedBillingPlans();
  const free = await getBillingPlanBySlug("free");
  if (!free) throw new Error("FREE_PLAN_NOT_CONFIGURED");

  const existing = await prisma.subscription.findFirst({
    where: { userId, status: "active" },
  });

  if (!existing) {
    const endAt = new Date();
    endAt.setFullYear(endAt.getFullYear() + 1);
    await prisma.subscription.create({
      data: {
        userId,
        billingPlanId: free.id,
        planName: free.nameZh,
        status: "active",
        startAt: new Date(),
        endAt,
        paymentStatus: "paid",
      },
    });
  }

  await ensureUserStorage(userId);
}

export type SubscriptionWithPlan = Subscription & { billingPlan: BillingPlan | null };

export async function getActiveUserSubscription(
  userId: string,
): Promise<SubscriptionWithPlan | null> {
  const now = new Date();
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
      startAt: { lte: now },
      endAt: { gte: now },
    },
    orderBy: { createdAt: "desc" },
    include: { billingPlan: true },
  });
}

export async function countActiveUserPlans(userId: string): Promise<number> {
  return prisma.plan.count({
    where: { userId, status: { not: "archived" } },
  });
}
