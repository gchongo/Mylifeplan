import type { BillingPlan } from "@prisma/client";
import {
  countActiveUserPlans,
  getActiveUserSubscription,
  getUserStorageUsedBytes,
} from "@/lib/services/billing";

export class EntitlementError extends Error {
  constructor(
    message: string,
    public readonly code: "PLAN_LIMIT" | "STORAGE_LIMIT" | "FILE_LIMIT" | "NO_SUBSCRIPTION",
  ) {
    super(message);
    this.name = "EntitlementError";
  }
}

export interface EffectiveLimits {
  billingPlanId: string | null;
  planSlug: string | null;
  planNameZh: string | null;
  planNameEn: string | null;
  maxPlans: number | null;
  maxStorageBytes: number;
  maxFileBytes: number;
  usedPlans: number;
  usedStorageBytes: number;
  canCreatePlan: boolean;
  subscriptionStatus: string | null;
  subscriptionEndAt: string | null;
}

function limitsFromBillingPlan(plan: BillingPlan): Pick<
  EffectiveLimits,
  "billingPlanId" | "planSlug" | "planNameZh" | "planNameEn" | "maxPlans" | "maxStorageBytes" | "maxFileBytes"
> {
  return {
    billingPlanId: plan.id,
    planSlug: plan.slug,
    planNameZh: plan.nameZh,
    planNameEn: plan.nameEn,
    maxPlans: plan.maxPlans,
    maxStorageBytes: plan.maxStorageBytes,
    maxFileBytes: plan.maxFileBytes,
  };
}

export async function getEffectiveLimits(userId: string): Promise<EffectiveLimits> {
  const [subscription, usedPlans, usedStorageBytes] = await Promise.all([
    getActiveUserSubscription(userId),
    countActiveUserPlans(userId),
    getUserStorageUsedBytes(userId),
  ]);

  const billingPlan = subscription?.billingPlan;
  const base = billingPlan
    ? limitsFromBillingPlan(billingPlan)
    : {
        billingPlanId: null,
        planSlug: null,
        planNameZh: subscription?.planName ?? null,
        planNameEn: null,
        maxPlans: 10,
        maxStorageBytes: 15 * 1024 * 1024,
        maxFileBytes: 5 * 1024 * 1024,
      };

  const canCreatePlan =
    base.maxPlans == null ? true : usedPlans < base.maxPlans;

  return {
    ...base,
    usedPlans,
    usedStorageBytes,
    canCreatePlan,
    subscriptionStatus: subscription?.status ?? null,
    subscriptionEndAt: subscription?.endAt.toISOString() ?? null,
  };
}

export async function assertCanCreatePlan(userId: string) {
  const limits = await getEffectiveLimits(userId);
  if (!limits.canCreatePlan) {
    throw new EntitlementError(
      `已达套餐计划上限（${limits.usedPlans}/${limits.maxPlans}）`,
      "PLAN_LIMIT",
    );
  }
}

export async function assertCanUpload(userId: string, fileSize: number) {
  const limits = await getEffectiveLimits(userId);
  if (fileSize > limits.maxFileBytes) {
    throw new EntitlementError("单文件超过当前套餐大小限制", "FILE_LIMIT");
  }
  if (limits.usedStorageBytes + fileSize > limits.maxStorageBytes) {
    throw new EntitlementError("存储空间已达套餐上限", "STORAGE_LIMIT");
  }
}

export function canUploadWithLimits(limits: EffectiveLimits, fileSize: number): boolean {
  if (fileSize > limits.maxFileBytes) return false;
  return limits.usedStorageBytes + fileSize <= limits.maxStorageBytes;
}
