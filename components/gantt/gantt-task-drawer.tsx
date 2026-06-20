"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Loading } from "@/components/ui/feedback";
import { TaskDetailClient } from "@/components/tasks/task-detail-client";
import { DrawerSubtaskTree } from "@/components/gantt/drawer-subtask-tree";
import type { TaskFormValues } from "@/components/forms/task-form";
import type { TaskStatus } from "@prisma/client";
import type { GanttItem } from "@/types";
import { getEffectiveEndDate, shouldShowInMemo } from "@/lib/content-router";
import { deriveParentStatus } from "@/lib/services/task-rollup";

function asTaskStatus(status: string | undefined | null): TaskStatus {
  if (
    status === "todo" ||
    status === "in_progress" ||
    status === "done" ||
    status === "archived"
  ) {
    return status;
  }
  return "todo";
}

export function GanttTaskDrawer({
  taskId,
  open,
  allTasks,
  onClose,
  onOpenTask,
  onChanged,
  onEditTask,
  onCreateSubtask,
}: {
  taskId: string | null;
  open: boolean;
  allTasks: GanttItem[];
  onClose: () => void;
  onOpenTask: (id: string) => void;
  onChanged: () => void;
  onEditTask: (taskId: string) => void;
  onCreateSubtask: (parentId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<(TaskFormValues & { id: string }) | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !taskId) {
      setTask(null);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.task) {
          setError("任务不存在");
          setTask(null);
          return;
        }
        setTask(data.task);
      })
      .catch(() => {
        if (!cancelled) setError("加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, taskId]);

  async function handleChanged() {
    onChanged();
    if (!taskId) return;
    const res = await fetch(`/api/tasks/${taskId}`);
    const data = await res.json();
    if (data.task) setTask(data.task);
  }

  const inMemo = task
    ? shouldShowInMemo({ startDate: task.startDate, dueDate: task.dueDate })
    : false;
  const gantt = task?.startDate
    ? getEffectiveEndDate({ startDate: task.startDate, dueDate: task.dueDate })
    : null;
  const childTasks = taskId
    ? allTasks
        .filter((t) => t.parentId === taskId)
        .map((t) => ({ id: t.id, title: t.title, status: t.status ?? "todo" }))
    : [];
  const childStatuses = childTasks.map((c) => asTaskStatus(c.status));
  const displayStatus = task
    ? deriveParentStatus(asTaskStatus(task.status), childStatuses)
    : "todo";
  const hasRollup = childStatuses.length > 0;

  return (
    <Drawer open={open} onClose={onClose} title={task?.title ?? "任务详情"}>
      {loading && <Loading label="加载任务…" />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && task && (
        <TaskDetailClient
          task={task}
          displayStatus={displayStatus}
          hasRollup={hasRollup}
          childTasks={childTasks}
          inMemo={inMemo}
          ganttEnd={gantt?.effectiveEnd ?? undefined}
          ganttVirtual={gantt?.isVirtualEnd}
          embedded
          onClose={onClose}
          onChanged={handleChanged}
          onOpenTask={onOpenTask}
          onEdit={() => onEditTask(task.id)}
          subtaskTree={
            <DrawerSubtaskTree
              parentTaskId={task.id}
              allTasks={allTasks}
              onOpenTask={onOpenTask}
              onCreateSubtask={onCreateSubtask}
            />
          }
        />
      )}
    </Drawer>
  );
}
