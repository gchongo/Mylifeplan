"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { GanttItem } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  todo: "待办",
  in_progress: "执行",
  done: "完成",
  archived: "归档",
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

function SubtaskNode({
  task,
  byId,
  expanded,
  onToggle,
  onOpenTask,
  onCreateSubtask,
}: {
  task: GanttItem;
  byId: Map<string, GanttItem>;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onOpenTask: (id: string) => void;
  onCreateSubtask: (parentId: string) => void;
}) {
  const depth = taskDepthInTree(task.id, byId);
  const children = [...byId.values()].filter((t) => t.parentId === task.id);
  const canHaveChildren = depth < 2;
  const hasChildren = children.length > 0;
  const showToggle = hasChildren || canHaveChildren;
  const isExpanded = expanded.has(task.id);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 rounded-lg border border-gray-100 px-2 py-2">
        {showToggle ? (
          <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100"
            onClick={() => onToggle(task.id)}
            aria-label={isExpanded ? "折叠" : "展开"}
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
        >
          {task.title}
        </button>
        <Badge variant="info" className="shrink-0 scale-90">
          {STATUS_LABEL[task.status ?? "todo"] ?? task.status}
        </Badge>
      </div>

      {isExpanded && (
        <div className="ml-6 space-y-2 border-l border-dashed border-gray-200 pl-3">
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600">
            <dt className="text-gray-400">开始</dt>
            <dd>{task.startDate}</dd>
            <dt className="text-gray-400">截止</dt>
            <dd>{task.dueDate ?? task.effectiveEnd}</dd>
          </dl>

          {children.map((child) => (
            <SubtaskNode
              key={child.id}
              task={child}
              byId={byId}
              expanded={expanded}
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

  const byId = useMemo(() => new Map(allTasks.map((t) => [t.id, t])), [allTasks]);
  const directChildren = useMemo(
    () => allTasks.filter((t) => t.parentId === parentTaskId),
    [allTasks, parentTaskId],
  );

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
