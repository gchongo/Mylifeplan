import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskForm } from "@/components/forms/task-form";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { getParentDateBounds } from "@/lib/task-parent-dates";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ parentTaskId?: string; redirect?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const redirectTo = params.redirect === "/gantt" ? "/gantt" : "/tasks";
  const backHref = params.redirect === "/gantt" ? "/gantt" : "/tasks";

  let parentDateBounds = null;
  if (params.parentTaskId) {
    const parent = await prisma.task.findFirst({
      where: { id: params.parentTaskId, userId: session.userId },
    });
    if (parent) parentDateBounds = getParentDateBounds(parent);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={backHref} className="text-sm text-brand-600 hover:underline">
        ← 返回{params.redirect === "/gantt" ? "甘特图" : "任务列表"}
      </Link>
      <h1 className="mb-4 mt-2 text-xl font-semibold text-gray-900">
        {params.parentTaskId ? "新建子任务" : "新建任务"}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>任务信息</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            defaultParentTaskId={params.parentTaskId ?? null}
            redirectTo={redirectTo}
            parentDateBounds={parentDateBounds}
          />
        </CardContent>
      </Card>
    </div>
  );
}
