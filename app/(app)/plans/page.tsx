import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { buildPlanTree } from "@/lib/plan-tree";
import { redirect } from "next/navigation";
import Link from "next/link";
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
          浏览与管理计划树。新建请回到{" "}
          <Link href="/" className="text-brand-600 hover:underline">
            首页信息流
          </Link>
          ，在发表框选择「计划」发布。
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">计划树</h2>
        <PlanTree roots={tree} />
      </div>
    </div>
  );
}
