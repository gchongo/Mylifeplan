import { parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { syncMemoForPlan, syncMemoForTask } from "@/lib/services/memo-sync";
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
    dueDate?: string | null;
    endDate?: string | null;
  },
) {
  const memo = await prisma.memo.findFirst({ where: { id: memoId, userId } });
  if (!memo) throw new Error("NOT_FOUND");

  if (memo.linkedTaskId) {
    const task = await prisma.task.findFirst({ where: { id: memo.linkedTaskId, userId } });
    if (!task) throw new Error("NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: task.id },
        data: {
          ...(data.title !== undefined && { title: data.title.trim() }),
          ...(data.description !== undefined && {
            description: data.description?.trim() || null,
          }),
          ...(data.startDate !== undefined && { startDate: parseDateOnly(data.startDate || null) }),
          ...(data.dueDate !== undefined && { dueDate: parseDateOnly(data.dueDate || null) }),
        },
      });

      await syncMemoForTask(updated, tx);
      await writeFeed({
        userId,
        itemType: "task",
        itemId: updated.id,
        actionType: "update",
        content: updated.title,
      });

      return { type: "task" as const, item: updated };
    });
  }

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

  if (!memo.linkedTaskId && !memo.linkedPlanId) {
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

  throw new Error("INVALID_MEMO");
}

export async function archiveMemoById(userId: string, memoId: string) {
  const memo = await prisma.memo.findFirst({ where: { id: memoId, userId } });
  if (!memo) throw new Error("NOT_FOUND");

  if (memo.linkedTaskId) {
    const { updateTask } = await import("@/lib/services/task");
    return updateTask(userId, memo.linkedTaskId, { status: "archived" });
  }

  if (memo.linkedPlanId) {
    const { updatePlan } = await import("@/lib/services/plan");
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
    if (memo.linkedTaskId) {
      await tx.task.delete({ where: { id: memo.linkedTaskId } });
    } else if (memo.linkedPlanId) {
      await tx.plan.delete({ where: { id: memo.linkedPlanId } });
    }
    await tx.memo.delete({ where: { id: memoId } });
  });
}
