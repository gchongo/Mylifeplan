"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { deriveParentStatus } from "@/lib/services/task-rollup";
import type { TaskStatus } from "@prisma/client";
import { shouldShowInMemo } from "@/lib/content-router";

export interface TaskTreeNode {
  id: string;
  title: string;
  status: TaskStatus;
  startDate: string | null;
  dueDate: string | null;
  parentTaskId: string | null;
}

const statusLabels: Record<string, string> = {
  todo: "待办",
  in_progress: "进行中",
  done: "已完成",
  archived: "已归档",
};

function buildTree(tasks: TaskTreeNode[]) {
  const byParent = new Map<string | null, TaskTreeNode[]>();
  for (const t of tasks) {
    const key = t.parentTaskId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(t);
  }
  return byParent;
}

function TreeNode({
  task,
  childTasks,
  allTasks,
  collapsed,
  onToggle,
}: {
  task: TaskTreeNode;
  childTasks: TaskTreeNode[];
  allTasks: TaskTreeNode[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
}) {
  const childStatuses = childTasks.map((c) => c.status);
  const displayStatus = deriveParentStatus(task.status, childStatuses);
  const hasRollup = childTasks.length > 0;
  const inMemo = shouldShowInMemo({ startDate: task.startDate, dueDate: task.dueDate });
  const isCollapsed = collapsed.has(task.id);

  return (
    <li>
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        {childTasks.length > 0 ? (
          <button
            type="button"
            className="w-5 shrink-0 text-gray-400 hover:text-gray-700"
            onClick={() => onToggle(task.id)}
            aria-label={isCollapsed ? "展开" : "折叠"}
          >
            {isCollapsed ? "▶" : "▼"}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <Link href={`/tasks/${task.id}`} className="font-medium hover:text-brand-600">
            {task.title}
          </Link>
          <p className="text-xs text-gray-500">
            {task.startDate ?? "无开始"}
            {task.dueDate ? ` → ${task.dueDate}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {inMemo && <Badge variant="warning">备忘录</Badge>}
          <Badge variant={task.status === "archived" ? "danger" : "info"}>
            {statusLabels[displayStatus] ?? displayStatus}
            {hasRollup && "（汇总）"}
          </Badge>
        </div>
      </div>
      {childTasks.length > 0 && !isCollapsed && (
        <ul className="ml-6 mt-1 space-y-1 border-l border-gray-200 pl-2">
          {childTasks.map((child) => (
            <TreeBranch
              key={child.id}
              task={child}
              byParent={buildTree(allTasks)}
              allTasks={allTasks}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function TreeBranch({
  task,
  byParent,
  allTasks,
  collapsed,
  onToggle,
}: {
  task: TaskTreeNode;
  byParent: Map<string | null, TaskTreeNode[]>;
  allTasks: TaskTreeNode[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
}) {
  const childTasks = byParent.get(task.id) ?? [];
  return (
    <TreeNode
      task={task}
      childTasks={childTasks}
      allTasks={allTasks}
      collapsed={collapsed}
      onToggle={onToggle}
    />
  );
}

export function TasksTreeList({ tasks }: { tasks: TaskTreeNode[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(
    () => (showArchived ? tasks : tasks.filter((t) => t.status !== "archived")),
    [tasks, showArchived],
  );

  const byParent = useMemo(() => buildTree(filtered), [filtered]);
  const roots = byParent.get(null) ?? [];

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const archivedCount = tasks.filter((t) => t.status === "archived").length;

  return (
    <div>
      {archivedCount > 0 && (
        <button
          type="button"
          className="mb-3 text-sm text-brand-600 hover:underline"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? "隐藏已归档" : `显示已归档（${archivedCount}）`}
        </button>
      )}
      <ul className="space-y-2">
        {roots.map((root) => (
          <TreeBranch
            key={root.id}
            task={root}
            byParent={byParent}
            allTasks={filtered}
            collapsed={collapsed}
            onToggle={toggle}
          />
        ))}
      </ul>
    </div>
  );
}
