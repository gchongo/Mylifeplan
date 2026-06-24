import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * B 模型：计划与便签分离，不再自动为未排期计划创建关联便签。
 * 仅在计划变更时清理历史 linkedPlanId 便签（迁移兼容）。
 */
export async function syncMemoForPlan(
  plan: Pick<Plan, "id">,
  db: Tx | typeof prisma = prisma,
) {
  await db.memo.deleteMany({ where: { linkedPlanId: plan.id } });
}

export async function deleteMemoForPlan(planId: string, db: Tx | typeof prisma = prisma) {
  await db.memo.deleteMany({ where: { linkedPlanId: planId } });
}
