import Link from "next/link";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { serializePlan } from "@/lib/services/plan";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm } from "@/components/forms/plan-form";
import { Badge } from "@/components/ui/badge";

export default async function ShortPlansPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const plans = await prisma.plan.findMany({
    where: { userId: session.userId, type: { in: ["weekly", "daily"] } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">短期计划</h1>
        <p className="text-sm text-gray-500">weekly / daily</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新建短期计划</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm defaultType="weekly" />
        </CardContent>
      </Card>

      <ul className="space-y-2">
        {plans.map((plan) => (
          <li
            key={plan.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <Link href={`/plans/${plan.id}`} className="font-medium hover:text-brand-600">
              {plan.title}
            </Link>
            <Badge variant="info">{plan.type}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
