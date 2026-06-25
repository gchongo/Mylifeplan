import type { Subscription, User, BillingPlan } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  AdminSubscriptionCreateInput,
  AdminSubscriptionPatchInput,
} from "@/lib/validations/admin";
import { getEffectiveLimits } from "@/lib/entitlements";
import { countActiveUserPlans } from "@/lib/services/billing";

export function serializeAdminUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

type SubWithUser = Subscription & {
  user?: Pick<User, "email" | "name">;
  billingPlan?: Pick<BillingPlan, "slug" | "nameZh" | "nameEn"> | null;
};

export function serializeAdminSubscription(sub: SubWithUser) {
  return {
    id: sub.id,
    userId: sub.userId,
    userEmail: sub.user?.email ?? null,
    userName: sub.user?.name ?? null,
    billingPlanId: sub.billingPlanId,
    billingPlanSlug: sub.billingPlan?.slug ?? null,
    planName: sub.planName,
    status: sub.status,
    paymentStatus: sub.paymentStatus,
    startAt: sub.startAt.toISOString(),
    endAt: sub.endAt.toISOString(),
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  };
}

export async function listAdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { subscriptions: true, plans: true } },
    },
  });

  return users.map((u) => ({
    ...serializeAdminUser(u),
    subscriptionCount: u._count.subscriptions,
    planCount: u._count.plans,
  }));
}

export async function getAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        include: { billingPlan: { select: { slug: true, nameZh: true, nameEn: true } } },
      },
      _count: { select: { plans: true, memos: true } },
    },
  });
  if (!user) return null;

  const entitlements = await getEffectiveLimits(userId);
  const activePlanCount = await countActiveUserPlans(userId);

  return {
    ...serializeAdminUser(user),
    stats: {
      plans: user._count.plans,
      activePlans: activePlanCount,
      memos: user._count.memos,
    },
    entitlements,
    subscriptions: user.subscriptions.map((s) =>
      serializeAdminSubscription({ ...s, billingPlan: s.billingPlan }),
    ),
  };
}

export async function setUserActive(
  adminUserId: string,
  targetUserId: string,
  isActive: boolean,
) {
  if (adminUserId === targetUserId && !isActive) {
    throw new Error("不能禁用自己的账号");
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new Error("NOT_FOUND");

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive },
  });

  return serializeAdminUser(updated);
}

export async function listAdminSubscriptions() {
  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      billingPlan: { select: { slug: true, nameZh: true, nameEn: true } },
    },
  });
  return subs.map((s) => serializeAdminSubscription({ ...s, user: s.user, billingPlan: s.billingPlan }));
}

export async function createAdminSubscription(input: AdminSubscriptionCreateInput) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new Error("NOT_FOUND");

  const billingPlan = await prisma.billingPlan.findUnique({ where: { id: input.billingPlanId } });
  if (!billingPlan) throw new Error("PLAN_NOT_FOUND");
  if (!billingPlan.isActive) throw new Error("套餐已停用");

  const startAt = input.startAt ? new Date(input.startAt) : new Date();
  const endAt = input.endAt
    ? new Date(input.endAt)
    : new Date(startAt.getTime() + 365 * 24 * 60 * 60 * 1000);

  if (endAt < startAt) throw new Error("结束时间不能早于开始时间");

  const created = await prisma.subscription.create({
    data: {
      userId: input.userId,
      billingPlanId: billingPlan.id,
      planName: billingPlan.nameZh,
      status: input.status ?? "active",
      paymentStatus: input.paymentStatus ?? "paid",
      startAt,
      endAt,
    },
    include: {
      user: { select: { email: true, name: true } },
      billingPlan: { select: { slug: true, nameZh: true, nameEn: true } },
    },
  });

  return serializeAdminSubscription({
    ...created,
    user: created.user,
    billingPlan: created.billingPlan,
  });
}

export async function updateAdminSubscription(subId: string, input: AdminSubscriptionPatchInput) {
  const existing = await prisma.subscription.findUnique({ where: { id: subId } });
  if (!existing) throw new Error("NOT_FOUND");

  if (input.startAt && input.endAt) {
    const start = new Date(input.startAt);
    const end = new Date(input.endAt);
    if (end < start) throw new Error("结束时间不能早于开始时间");
  }

  let planName = input.planName;
  if (input.billingPlanId) {
    const billingPlan = await prisma.billingPlan.findUnique({ where: { id: input.billingPlanId } });
    if (!billingPlan) throw new Error("PLAN_NOT_FOUND");
    planName = billingPlan.nameZh;
  }

  const updated = await prisma.subscription.update({
    where: { id: subId },
    data: {
      ...(planName !== undefined && { planName }),
      ...(input.billingPlanId !== undefined && { billingPlanId: input.billingPlanId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.paymentStatus !== undefined && { paymentStatus: input.paymentStatus }),
      ...(input.startAt !== undefined && { startAt: new Date(input.startAt) }),
      ...(input.endAt !== undefined && { endAt: new Date(input.endAt) }),
    },
    include: {
      user: { select: { email: true, name: true } },
      billingPlan: { select: { slug: true, nameZh: true, nameEn: true } },
    },
  });

  return serializeAdminSubscription({ ...updated, user: updated.user, billingPlan: updated.billingPlan });
}

export async function getAdminOverview() {
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [userCount, activeUserCount, subscriptionCount, expiringSoon, todayRegistered, billingPlans] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.subscription.count({
        where: { status: "active", endAt: { gte: now, lte: inSevenDays } },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),
      prisma.billingPlan.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

  return {
    userCount,
    activeUserCount,
    subscriptionCount,
    expiringSoon,
    todayRegistered,
    billingPlans: billingPlans.map((p) => ({
      id: p.id,
      slug: p.slug,
      nameZh: p.nameZh,
      maxPlans: p.maxPlans,
      maxStorageBytes: p.maxStorageBytes,
      isActive: p.isActive,
    })),
  };
}
