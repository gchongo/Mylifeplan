"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "@/components/ui";

interface TaskRow {
  id: string;
  title: string;
  parentTaskId: string | null;
}

function buildDepthMap(tasks: TaskRow[]): Map<string, number> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const depthCache = new Map<string, number>();

  function depth(id: string): number {
    const cached = depthCache.get(id);
    if (cached !== undefined) return cached;
    const task = byId.get(id);
    if (!task?.parentTaskId) {
      depthCache.set(id, 1);
      return 1;
    }
    const d = depth(task.parentTaskId) + 1;
    depthCache.set(id, d);
    return d;
  }

  for (const t of tasks) depth(t.id);
  return depthCache;
}

function collectDescendants(tasks: TaskRow[], rootId: string): Set<string> {
  const children = new Map<string, string[]>();
  for (const t of tasks) {
    if (t.parentTaskId) {
      const list = children.get(t.parentTaskId) ?? [];
      list.push(t.id);
      children.set(t.parentTaskId, list);
    }
  }
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const child of children.get(id) ?? []) {
      if (!out.has(child)) {
        out.add(child);
        stack.push(child);
      }
    }
  }
  return out;
}

export function ParentTaskSelect({
  excludeTaskId,
  value,
  onChange,
  name = "parentTaskId",
}: {
  excludeTaskId?: string;
  value?: string | null;
  onChange?: (id: string | null) => void;
  name?: string;
}) {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => setTasks(data.tasks ?? []))
      .finally(() => setLoading(false));
  }, []);

  const options = useMemo(() => {
    const depthMap = buildDepthMap(tasks);
    const excluded = excludeTaskId
      ? new Set([excludeTaskId, ...collectDescendants(tasks, excludeTaskId)])
      : new Set<string>();

    return tasks
      .filter((t) => !excluded.has(t.id) && (depthMap.get(t.id) ?? 1) < 3)
      .map((t) => ({
        value: t.id,
        label: t.title,
      }));
  }, [tasks, excludeTaskId]);

  return (
    <Select
      name={name}
      label="父任务（可选，最多 3 层）"
      options={[{ value: "", label: "无（独立任务）" }, ...options]}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value || null)}
      disabled={loading}
    />
  );
}
