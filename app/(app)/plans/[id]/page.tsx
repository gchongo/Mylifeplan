import Link from "next/link";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { serializePlan } from "@/lib/services/plan";
import { getContributionsForPlanTree } from "@/lib/services/contribution";
import { redirect, notFound } from "next/navigation";
import { PlanDetailClient } from "@/components/plans/plan-detail-client";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const plan = await prisma.plan.findFirst({
    where: { id, userId: session.userId },
    include: {
      subPlans: { where: { status: { not: "archived" } }, orderBy: { createdAt: "asc" } },
      parentPlan: true,
    },
  });
  if (!plan) notFound();

  const contributions = await getContributionsForPlanTree(session.userId, id);
  const serialized = serializePlan(plan);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/plans" className="text-sm text-brand-600 hover:underline">
        ← 返回计划列表
      </Link>
      <PlanDetailClient
        plan={{
          id: plan.id,
          title: plan.title,
          description: plan.description,
          type: plan.type,
          parentPlanId: plan.parentPlanId,
          startDate: serialized.startDate,
          endDate: serialized.endDate,
          status: plan.status,
        }}
        subPlans={plan.subPlans.map((sp) => ({
          id: sp.id,
          title: sp.title,
          status: sp.status,
        }))}
        parentTitle={plan.parentPlan?.title}
        contributions={contributions}
      />
    </div>
  );
}
