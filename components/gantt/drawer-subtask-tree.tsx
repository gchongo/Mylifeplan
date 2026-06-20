"use client";

import { useMemo, useState } from "react";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import type { GanttItem } from "@/types";
import { getStatusStyle, statusLabel } from "@/lib/task-status-style";
import { cn } from "@/lib/utils";

const PRIORITY_LABEL: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

function taskDepthInTree(taskId: string, byId: Map<string, GanttItem>): number {
  let depth = 0;
  let cur = byId.get(taskId);
  while (cur?.parentId && byId.has(cur.parentId)) {
    depth++;
    cur = byId.get(cur.parentId);
  }
  return depth;
}

function SubtaskDetailPanel({ detail }: { detail: TaskFormValues & { id: string } }) {
  return (
    <div className="space-y-2 text-xs text-gray-600">
      {detail.description ? (
        <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-sm text-gray-700">
          {detail.description}
        </p>
      ) : (
        <p className="text-gray-400">暂无描述</p>
      )}
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
        <dt className="text-gray-400">开始</dt>
        <dd>{detail.startDate ?? "—"}</dd>
        <dt className="text-gray-400">截止</dt>
        <dd>{detail.dueDate ?? "—"}</dd>
        <dt className="text-gray-400">优先级</dt>
        <dd>{detail.priority ? (PRIORITY_LABEL[detail.priority] ?? detail.priority) : "—"}</dd>
        <dt className="text-gray-400">状态</dt>
        <dd className="flex items-center gap-1.5">
          <TaskStatusIndicator status={detail.status} dueDate={detail.dueDate} />
          <span className="text-gray-500">{statusLabel(detail.status, detail.dueDate)}</span>
        </dd>
      </dl>
    </div>
  );
}

function SubtaskNode({
  task,
  byId,
  expanded,
  detailsCache,
  loadingIds,
  onToggle,
  onOpenTask,
  onCreateSubtask,
}: {
  task: GanttItem;
  byId: Map<string, GanttItem>;
  expanded: Set<string>;
  detailsCache: Map<string, TaskFormValues & { id: string }>;
  loadingIds: Set<string>;
  onToggle: (id: string) => void;
  onOpenTask: (id: string) => void;
  onCreateSubtask: (parentId: string) => void;
}) {
  const depth = taskDepthInTree(task.id, byId);
  const children = [...byId.values()].filter((t) => t.parentId === task.id);
  const canHaveChildren = depth < 2;
  const hasChildren = children.length > 0;
  const showToggle = true;
  const isExpanded = expanded.has(task.id);
  const detail = detailsCache.get(task.id);
  const isLoading = loadingIds.has(task.id);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg border border-gray-100 border-l-2 px-2 py-2",
          getStatusStyle(task.status, task.dueDate).rowBg,
          getStatusStyle(task.status, task.dueDate).stripe,
        )}
      >
        {showToggle ? (
          <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100"
            onClick={() => onToggle(task.id)}
            aria-label={isExpanded ? "折叠详情" : "展开详情"}
          >
            <span className={cn("text-[10px] transition-transform", isExpanded && "rotate-90")}>
              ▶
            </span>
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onOpenTask(task.id)}
          className="min-w-0 flex-1 truncate text-left text-sm hover:text-brand-600"
          title="查看完整详情"
        >
          {task.title}
        </button>
        <TaskStatusIndicator status={task.status} dueDate={task.dueDate} />
      </div>

      {isExpanded && (
        <div className="ml-6 space-y-2 border-l border-dashed border-gray-200 pl-3">
          {isLoading && <p className="text-xs text-gray-400">加载详情…</p>}
          {!isLoading && detail && <SubtaskDetailPanel detail={detail} />}

          {children.map((child) => (
            <SubtaskNode
              key={child.id}
              task={child}
              byId={byId}
              expanded={expanded}
              detailsCache={detailsCache}
              loadingIds={loadingIds}
              onToggle={onToggle}
              onOpenTask={onOpenTask}
              onCreateSubtask={onCreateSubtask}
            />
          ))}

          {canHaveChildren && (
            <button
              type="button"
              onClick={() => onCreateSubtask(task.id)}
              className="text-xs text-brand-600 hover:underline"
            >
              + 添加子任务
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function DrawerSubtaskTree({
  parentTaskId,
  allTasks,
  onOpenTask,
  onCreateSubtask,
}: {
  parentTaskId: string;
  allTasks: GanttItem[];
  onOpenTask: (id: string) => void;
  onCreateSubtask: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [detailsCache, setDetailsCache] = useState<Map<string, TaskFormValues & { id: string }>>(
    new Map(),
  );
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const byId = useMemo(() => new Map(allTasks.map((t) => [t.id, t])), [allTasks]);
  const directChildren = useMemo(
    () => allTasks.filter((t) => t.parentId === parentTaskId),
    [allTasks, parentTaskId],
  );

  async function toggleExpand(id: string) {
    const willExpand = !expanded.has(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (!willExpand) return;

    let cached = false;
    setDetailsCache((prev) => {
      cached = prev.has(id);
      return prev;
    });
    if (cached) return;

    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/tasks/${id}`);
      const data = await res.json();
      if (data.task) {
        setDetailsCache((prev) => new Map(prev).set(id, data.task));
      }
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  if (directChildren.length === 0) {
    const parentDepth = taskDepthInTree(parentTaskId, byId);
    if (parentDepth >= 2) return null;
    return (
      <button
        type="button"
        onClick={() => onCreateSubtask(parentTaskId)}
        className="text-sm text-brand-600 hover:underline"
      >
        + 添加子任务
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {directChildren.map((child) => (
        <SubtaskNode
          key={child.id}
          task={child}
          byId={byId}
          expanded={expanded}
          detailsCache={detailsCache}
          loadingIds={loadingIds}
          onToggle={toggleExpand}
          onOpenTask={onOpenTask}
          onCreateSubtask={onCreateSubtask}
        />
      ))}

      {taskDepthInTree(parentTaskId, byId) < 2 && (
        <button
          type="button"
          onClick={() => onCreateSubtask(parentTaskId)}
          className="text-sm text-brand-600 hover:underline"
        >
          + 添加子任务
        </button>
      )}
    </div>
  );
}
