import Link from "next/link";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { serializePlan } from "@/lib/services/plan";
import { serializeTask } from "@/lib/services/task";
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
      subPlans: { orderBy: { createdAt: "asc" } },
      tasks: { orderBy: { updatedAt: "desc" } },
      parentPlan: true,
    },
  });
  if (!plan) notFound();

  const serialized = serializePlan(plan);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={plan.type === "goal" || plan.type === "phase" ? "/plans/long" : "/plans/short"}
        className="text-sm text-brand-600 hover:underline"
      >
        ← 返回规划列表
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
        subPlans={plan.subPlans.map((sp: (typeof plan.subPlans)[number]) => ({
          id: sp.id,
          title: sp.title,
          type: sp.type,
          status: sp.status,
        }))}
        tasks={plan.tasks.map((t: (typeof plan.tasks)[number]) => {
          const s = serializeTask(t);
          return {
            id: t.id,
            title: t.title,
            status: t.status,
            startDate: s.startDate,
            dueDate: s.dueDate,
          };
        })}
        parentTitle={plan.parentPlan?.title}
      />
    </div>
  );
}
