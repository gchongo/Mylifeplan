import { parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { syncMemoForPlan } from "@/lib/services/memo-sync";
import { updatePlan } from "@/lib/services/plan";
import { writeFeed } from "@/lib/services/feed";

export async function createStandaloneMemo(
  userId: string,
  data: { title: string; description?: string | null },
) {
  const title = data.title.trim();
  if (!title) throw new Error("标题不能为空");

  return prisma.$transaction(async (tx) => {
    const memo = await tx.memo.create({
      data: {
        userId,
        title,
        description: data.description?.trim() || null,
      },
    });

    await writeFeed({
      userId,
      itemType: "memo",
      itemId: memo.id,
      actionType: "create",
      content: title,
    });

    return memo;
  });
}

export async function updateMemoById(
  userId: string,
  memoId: string,
  data: {
    title?: string;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  },
) {
  const memo = await prisma.memo.findFirst({ where: { id: memoId, userId } });
  if (!memo) throw new Error("NOT_FOUND");

  if (memo.linkedPlanId) {
    const plan = await prisma.plan.findFirst({ where: { id: memo.linkedPlanId, userId } });
    if (!plan) throw new Error("NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.plan.update({
        where: { id: plan.id },
        data: {
          ...(data.title !== undefined && { title: data.title.trim() }),
          ...(data.description !== undefined && {
            description: data.description?.trim() || null,
          }),
          ...(data.startDate !== undefined && { startDate: parseDateOnly(data.startDate || null) }),
          ...(data.endDate !== undefined && { endDate: parseDateOnly(data.endDate || null) }),
        },
      });

      await syncMemoForPlan(updated, tx);
      await writeFeed({
        userId,
        itemType: "plan",
        itemId: updated.id,
        actionType: "update",
        content: updated.title,
      });

      return { type: "plan" as const, item: updated };
    });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.memo.update({
      where: { id: memo.id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
      },
    });

    await writeFeed({
      userId,
      itemType: "memo",
      itemId: updated.id,
      actionType: "update",
      content: updated.title,
    });

    return { type: "memo" as const, item: updated };
  });
}

export async function archiveMemoById(userId: string, memoId: string) {
  const memo = await prisma.memo.findFirst({ where: { id: memoId, userId } });
  if (!memo) throw new Error("NOT_FOUND");

  if (memo.linkedPlanId) {
    return updatePlan(userId, memo.linkedPlanId, { status: "archived" });
  }

  return prisma.$transaction(async (tx) => {
    await tx.memo.delete({ where: { id: memoId } });
    await writeFeed({
      userId,
      itemType: "memo",
      itemId: memoId,
      actionType: "archive",
      content: memo.title,
    });
  });
}

export async function deleteMemoById(userId: string, memoId: string) {
  const memo = await prisma.memo.findFirst({ where: { id: memoId, userId } });
  if (!memo) throw new Error("NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    if (memo.linkedPlanId) {
      await tx.plan.delete({ where: { id: memo.linkedPlanId } });
    }
    await tx.memo.delete({ where: { id: memoId } });
  });
}
