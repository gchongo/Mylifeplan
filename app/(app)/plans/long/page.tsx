import Link from "next/link";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm } from "@/components/forms/plan-form";
import { Badge } from "@/components/ui/badge";

export default async function LongPlansPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const plans = await prisma.plan.findMany({
    where: { userId: session.userId, type: { in: ["goal", "phase"] } },
    orderBy: { updatedAt: "desc" },
  });

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
        <h2 className="mb-3 text-sm font-semibold text-gray-700">已有计划</h2>
        <ul className="space-y-2">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <div>
                <Link
                  href={`/plans/${plan.id}`}
                  className="font-medium hover:text-brand-600"
                >
                  {plan.title}
                </Link>
                <p className="text-xs text-gray-400">ID: {plan.id}</p>
              </div>
              <Badge variant="info">{plan.type}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
