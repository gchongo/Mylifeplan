import type { Subscription, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AdminSubscriptionPatchInput } from "@/lib/validations/admin";

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

export function serializeAdminSubscription(sub: Subscription & { user?: Pick<User, "email" | "name"> }) {
  return {
    id: sub.id,
    userId: sub.userId,
    userEmail: sub.user?.email ?? null,
    userName: sub.user?.name ?? null,
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
      _count: { select: { subscriptions: true, tasks: true, plans: true } },
    },
  });

  return users.map((u) => ({
    ...serializeAdminUser(u),
    subscriptionCount: u._count.subscriptions,
    taskCount: u._count.tasks,
    planCount: u._count.plans,
  }));
}

export async function getAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" } },
      _count: { select: { tasks: true, plans: true, memos: true } },
    },
  });
  if (!user) return null;

  return {
    ...serializeAdminUser(user),
    stats: {
      tasks: user._count.tasks,
      plans: user._count.plans,
      memos: user._count.memos,
    },
    subscriptions: user.subscriptions.map((s) => serializeAdminSubscription(s)),
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
    include: { user: { select: { email: true, name: true } } },
  });
  return subs.map((s) => serializeAdminSubscription({ ...s, user: s.user }));
}

export async function updateAdminSubscription(subId: string, input: AdminSubscriptionPatchInput) {
  const existing = await prisma.subscription.findUnique({ where: { id: subId } });
  if (!existing) throw new Error("NOT_FOUND");

  if (input.startAt && input.endAt) {
    const start = new Date(input.startAt);
    const end = new Date(input.endAt);
    if (end < start) throw new Error("结束时间不能早于开始时间");
  }

  const updated = await prisma.subscription.update({
    where: { id: subId },
    data: {
      ...(input.planName !== undefined && { planName: input.planName }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.paymentStatus !== undefined && { paymentStatus: input.paymentStatus }),
      ...(input.startAt !== undefined && { startAt: new Date(input.startAt) }),
      ...(input.endAt !== undefined && { endAt: new Date(input.endAt) }),
    },
    include: { user: { select: { email: true, name: true } } },
  });

  return serializeAdminSubscription({ ...updated, user: updated.user });
}
