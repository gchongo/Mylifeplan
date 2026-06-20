import Link from "next/link";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { serializeTask } from "@/lib/services/task";
import { deriveParentStatus } from "@/lib/services/task-rollup";
import { redirect, notFound } from "next/navigation";
import { shouldShowInMemo, getEffectiveEndDate } from "@/lib/content-router";
import { TaskDetailClient } from "@/components/tasks/task-detail-client";

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
    include: {
      subTasks: { orderBy: { updatedAt: "desc" } },
    },
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

  const childStatuses = task.subTasks.map((c) => c.status);
  const displayStatus = deriveParentStatus(task.status, childStatuses);
  const hasRollup = childStatuses.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/tasks" className="text-sm text-brand-600 hover:underline">
        ← 返回任务列表
      </Link>
      <TaskDetailClient
        task={{
          id: task.id,
          title: task.title,
          description: task.description,
          startDate: serialized.startDate,
          dueDate: serialized.dueDate,
          priority: task.priority,
          status: task.status,
          parentTaskId: task.parentTaskId,
          planId: task.planId,
        }}
        displayStatus={displayStatus}
        hasRollup={hasRollup}
        childTasks={task.subTasks.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
        }))}
        inMemo={inMemo}
        ganttEnd={gantt?.effectiveEnd}
        ganttVirtual={gantt?.isVirtualEnd}
      />
    </div>
  );
}
