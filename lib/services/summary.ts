import { prisma } from "@/lib/db";
import { computePlanSummary } from "@/lib/plan-summary";

export async function getPlanSummary(userId: string) {
  const [plans, memos, contributions] = await Promise.all([
    prisma.plan.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        actualStartDate: true,
        actualEndDate: true,
        parentPlanId: true,
      },
    }),
    prisma.memo.count({ where: { userId } }),
    prisma.planContribution.count({ where: { userId } }),
  ]);

  return computePlanSummary(plans, { memos, contributions });
}
