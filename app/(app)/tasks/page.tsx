import Link from "next/link";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { serializeTask } from "@/lib/services/task";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { TasksTreeList } from "@/components/tasks/tasks-tree-list";

export default async function TasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
  });

  const nodes = tasks.map((task) => {
    const s = serializeTask(task);
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      startDate: s.startDate,
      dueDate: s.dueDate,
      parentTaskId: task.parentTaskId,
    };
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">任务列表</h1>
        <Link href="/tasks/new">
          <Button size="sm">新建任务</Button>
        </Link>
      </div>
      {nodes.length === 0 ? (
        <EmptyState title="暂无任务" description="点击「新建任务」开始。" />
      ) : (
        <TasksTreeList tasks={nodes} />
      )}
    </div>
  );
}
