import type { Plan, Task } from "@prisma/client";
import { shouldShowInMemo } from "@/lib/content-router";
import { prisma } from "@/lib/db";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function taskRoutable(task: Pick<Task, "startDate" | "dueDate">) {
  return { startDate: task.startDate, dueDate: task.dueDate };
}

function planRoutable(plan: Pick<Plan, "startDate" | "endDate">) {
  return { startDate: plan.startDate, endDate: plan.endDate };
}

export async function syncMemoForTask(
  task: Pick<Task, "id" | "userId" | "title" | "description" | "startDate" | "dueDate">,
  db: Tx | typeof prisma = prisma,
) {
  const inMemo = shouldShowInMemo(taskRoutable(task));
  const existing = await db.memo.findUnique({ where: { linkedTaskId: task.id } });

  if (inMemo) {
    if (existing) {
      await db.memo.update({
        where: { id: existing.id },
        data: { title: task.title, description: task.description },
      });
    } else {
      await db.memo.create({
        data: {
          userId: task.userId,
          title: task.title,
          description: task.description,
          linkedTaskId: task.id,
        },
      });
    }
    return;
  }

  if (existing) {
    await db.memo.delete({ where: { id: existing.id } });
  }
}

export async function syncMemoForPlan(
  plan: Pick<Plan, "id" | "userId" | "title" | "description" | "startDate" | "endDate">,
  db: Tx | typeof prisma = prisma,
) {
  const inMemo = shouldShowInMemo(planRoutable(plan));
  const existing = await db.memo.findUnique({ where: { linkedPlanId: plan.id } });

  if (inMemo) {
    if (existing) {
      await db.memo.update({
        where: { id: existing.id },
        data: { title: plan.title, description: plan.description },
      });
    } else {
      await db.memo.create({
        data: {
          userId: plan.userId,
          title: plan.title,
          description: plan.description,
          linkedPlanId: plan.id,
        },
      });
    }
    return;
  }

  if (existing) {
    await db.memo.delete({ where: { id: existing.id } });
  }
}

export async function deleteMemoForTask(taskId: string, db: Tx | typeof prisma = prisma) {
  await db.memo.deleteMany({ where: { linkedTaskId: taskId } });
}

export async function deleteMemoForPlan(planId: string, db: Tx | typeof prisma = prisma) {
  await db.memo.deleteMany({ where: { linkedPlanId: planId } });
}
