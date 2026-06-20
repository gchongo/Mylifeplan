import Link from "next/link";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm } from "@/components/forms/plan-form";
import { LongPlanTree } from "@/components/plans/long-plan-tree";

export default async function LongPlansPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const goals = await prisma.plan.findMany({
    where: { userId: session.userId, type: "goal" },
    orderBy: { updatedAt: "desc" },
    include: {
      subPlans: {
        where: { type: "phase" },
        orderBy: { createdAt: "asc" },
        include: {
          tasks: {
            where: { status: { not: "archived" } },
            orderBy: { updatedAt: "desc" },
            select: { id: true, title: true, status: true },
          },
        },
      },
    },
  });

  const orphanPhases = await prisma.plan.findMany({
    where: {
      userId: session.userId,
      type: "phase",
      parentPlanId: null,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      tasks: {
        where: { status: { not: "archived" } },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true },
      },
    },
  });

  const tree = goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    type: goal.type,
    status: goal.status,
    phases: goal.subPlans.map((phase) => ({
      id: phase.id,
      title: phase.title,
      type: phase.type,
      status: phase.status,
      tasks: phase.tasks,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">长期规划</h1>
        <p className="text-sm text-gray-500">goal → phase → 关联任务</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新建长期目标 / 阶段</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm defaultType="goal" />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">规划树</h2>
        <LongPlanTree goals={tree} />
      </div>

      {orphanPhases.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">未关联目标的阶段</h2>
          <ul className="space-y-2">
            {orphanPhases.map((phase) => (
              <li
                key={phase.id}
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <Link href={`/plans/${phase.id}`} className="font-medium hover:text-brand-600">
                  {phase.title}
                </Link>
                {phase.tasks.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-2">
                    {phase.tasks.map((task) => (
                      <li key={task.id}>
                        <Link href={`/tasks/${task.id}`} className="text-sm text-gray-700 hover:text-brand-600">
                          · {task.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
