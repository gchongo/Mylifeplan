import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { buildPlanTree } from "@/lib/plan-tree";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm } from "@/components/forms/plan-form";
import { PlanTree } from "@/components/plans/plan-tree";

export default async function PlansPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const plans = await prisma.plan.findMany({
    where: { userId: session.userId, status: { not: "archived" } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true, parentPlanId: true },
  });

  const tree = buildPlanTree(plans);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">计划</h1>
        <p className="text-sm text-gray-500">
          有日期的计划在甘特图与日历中展示；无日期的想法请写在备忘里。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新建计划</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">计划树</h2>
        <PlanTree roots={tree} />
      </div>
    </div>
  );
}
