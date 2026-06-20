import type { Plan } from "@prisma/client";
import { shouldShowInMemo } from "@/lib/content-router";
import { prisma } from "@/lib/db";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function planRoutable(plan: Pick<Plan, "startDate" | "endDate">) {
  return { startDate: plan.startDate, endDate: plan.endDate };
}

export async function syncMemoForPlan(
  plan: Pick<
    Plan,
    "id" | "userId" | "title" | "description" | "startDate" | "endDate" | "status"
  >,
  db: Tx | typeof prisma = prisma,
) {
  const existing = await db.memo.findUnique({ where: { linkedPlanId: plan.id } });

  if (plan.status === "archived") {
    if (existing) await db.memo.delete({ where: { id: existing.id } });
    return;
  }

  const inMemo = shouldShowInMemo(planRoutable(plan));

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

export async function deleteMemoForPlan(planId: string, db: Tx | typeof prisma = prisma) {
  await db.memo.deleteMany({ where: { linkedPlanId: planId } });
}
