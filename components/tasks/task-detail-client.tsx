"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskForm, type TaskFormValues } from "@/components/forms/task-form";

const statusLabels: Record<string, string> = {
  todo: "待办",
  in_progress: "进行中",
  archived: "已归档",
};

interface ChildTask {
  id: string;
  title: string;
  status: string;
}

export function TaskDetailClient({
  task,
  displayStatus,
  hasRollup,
  childTasks,
  inMemo,
  ganttEnd,
  ganttVirtual,
}: {
  task: TaskFormValues & { id: string };
  displayStatus: string;
  hasRollup: boolean;
  childTasks: ChildTask[];
  inMemo: boolean;
  ganttEnd?: string;
  ganttVirtual?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  async function handleDelete() {
    if (!confirm("确定删除此任务？关联备忘录也会删除。")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/tasks");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  async function quickStatus(status: string) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  if (showEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>编辑任务</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            task={task}
            redirectTo={`/tasks/${task.id}`}
          />
          <Button
            className="mt-4"
            variant="ghost"
            size="sm"
            onClick={() => setShowEdit(false)}
          >
            取消编辑
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <CardTitle className="text-xl">{task.title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {inMemo && <Badge variant="warning">备忘录</Badge>}
            <Badge variant="info">
              {statusLabels[displayStatus] ?? displayStatus}
              {hasRollup && "（汇总）"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-700">
          {task.description && <p>{task.description}</p>}
          <dl className="grid grid-cols-2 gap-2">
            <dt className="text-gray-500">开始日期</dt>
            <dd>{task.startDate ?? "—"}</dd>
            <dt className="text-gray-500">截止日期</dt>
            <dd>{task.dueDate ?? "—"}</dd>
            {ganttEnd && (
              <>
                <dt className="text-gray-500">甘特截止</dt>
                <dd>
                  {ganttEnd}
                  {ganttVirtual && "（预估）"}
                </dd>
              </>
            )}
            <dt className="text-gray-500">优先级</dt>
            <dd>{task.priority ?? "—"}</dd>
            <dt className="text-gray-500">自身状态</dt>
            <dd>{statusLabels[task.status ?? "todo"] ?? task.status}</dd>
          </dl>

          <div className="flex flex-wrap gap-2">
            {task.status !== "archived" && (
              <>
                {task.status !== "in_progress" && (
                  <Button size="sm" variant="secondary" onClick={() => quickStatus("in_progress")}>
                    开始
                  </Button>
                )}
                {task.status !== "done" && (
                  <Button size="sm" onClick={() => quickStatus("done")}>
                    完成
                  </Button>
                )}
                {task.status !== "todo" && (
                  <Button size="sm" variant="ghost" onClick={() => quickStatus("todo")}>
                    重置为待办
                  </Button>
                )}
              </>
            )}
            {task.status === "archived" ? (
              <Button size="sm" variant="secondary" onClick={() => quickStatus("todo")}>
                取消归档
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => quickStatus("archived")}>
                归档
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
              编辑
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDelete} disabled={deleting}>
              {deleting ? "删除中…" : "删除"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {childTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">子任务</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {childTasks.map((child) => (
                <li
                  key={child.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                >
                  <Link
                    href={`/tasks/${child.id}`}
                    className="hover:text-brand-600"
                  >
                    {child.title}
                  </Link>
                  <Badge variant="info">{statusLabels[child.status] ?? child.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
