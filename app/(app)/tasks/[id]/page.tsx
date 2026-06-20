import Link from "next/link";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { serializeTask } from "@/lib/services/task";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldShowInMemo } from "@/lib/content-router";
import { getEffectiveEndDate } from "@/lib/content-router";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: { id, userId: session.userId },
  });
  if (!task) notFound();

  const serialized = serializeTask(task);
  const inMemo = shouldShowInMemo({
    startDate: serialized.startDate,
    dueDate: serialized.dueDate,
  });
  const gantt =
    serialized.startDate &&
    getEffectiveEndDate({
      startDate: serialized.startDate,
      dueDate: serialized.dueDate,
    });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/tasks" className="text-sm text-brand-600 hover:underline">
        ← 返回任务列表
      </Link>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <CardTitle className="text-xl">{task.title}</CardTitle>
          <div className="flex gap-2">
            {inMemo && <Badge variant="warning">备忘录</Badge>}
            <Badge variant="info">{task.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          {task.description && <p>{task.description}</p>}
          <dl className="grid grid-cols-2 gap-2">
            <dt className="text-gray-500">开始日期</dt>
            <dd>{serialized.startDate ?? "—"}</dd>
            <dt className="text-gray-500">截止日期</dt>
            <dd>{serialized.dueDate ?? "—"}</dd>
            {gantt && (
              <>
                <dt className="text-gray-500">甘特截止</dt>
                <dd>
                  {gantt.effectiveEnd}
                  {gantt.isVirtualEnd && "（预估）"}
                </dd>
              </>
            )}
            <dt className="text-gray-500">优先级</dt>
            <dd>{task.priority ?? "—"}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
