import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { formatPlanDateTime } from "@/lib/dates";
import { PlansBoardClient } from "@/components/plans/plans-board-client";
import type { KanbanPlan } from "@/lib/kanban-board";
import { redirect } from "next/navigation";

export default async function PlansPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await prisma.plan.findMany({
    where: { userId: session.userId, status: { not: "archived" } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      startDate: true,
      endDate: true,
      parentPlanId: true,
      parentPlan: { select: { title: true } },
      subPlans: {
        where: { status: { not: "archived" } },
        select: { status: true },
      },
      _count: { select: { contributions: true } },
    },
  });

  const initialPlans: KanbanPlan[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    type: p.type,
    status: p.status,
    startDate: formatPlanDateTime(p.startDate),
    endDate: formatPlanDateTime(p.endDate),
    parentPlanId: p.parentPlanId,
    parentTitle: p.parentPlan?.title ?? null,
    childStatuses: p.subPlans.map((c) => c.status),
    contributionCount: p._count.contributions,
  }));

  return <PlansBoardClient initialPlans={initialPlans} />;
}
