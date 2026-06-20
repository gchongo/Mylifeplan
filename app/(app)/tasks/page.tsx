import Link from "next/link";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { serializeTask } from "@/lib/services/task";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { shouldShowInMemo } from "@/lib/content-router";

export default async function TasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">任务列表</h1>
        <Link href="/tasks/new">
          <Button size="sm">新建任务</Button>
        </Link>
      </div>
      {tasks.length === 0 ? (
        <EmptyState title="暂无任务" description="点击「新建任务」开始。" />
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const serialized = serializeTask(task);
            const inMemo = shouldShowInMemo({
              startDate: serialized.startDate,
              dueDate: serialized.dueDate,
            });
            return (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="font-medium text-gray-900 hover:text-brand-600"
                  >
                    {task.title}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {serialized.startDate ?? "无开始"}
                    {serialized.dueDate ? ` → ${serialized.dueDate}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {inMemo && <Badge variant="warning">备忘录</Badge>}
                  <Badge variant="info">{task.status}</Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
