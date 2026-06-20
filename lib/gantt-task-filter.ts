import { resolveVisualStatus, STATUS_LEGEND, type VisualStatusKey } from "@/lib/task-status-style";
import type { GanttItem } from "@/types";

export function isStatusFilterActive(filter: Set<VisualStatusKey>): boolean {
  return filter.size > 0 && filter.size < STATUS_LEGEND.length;
}

export function filterGanttTasksByStatus(
  tasks: GanttItem[],
  filter: Set<VisualStatusKey>,
  getDisplayStatus: (task: GanttItem) => string,
): GanttItem[] {
  if (!isStatusFilterActive(filter)) return tasks;

  const taskIds = new Set(tasks.map((t) => t.id));
  const included = new Set<string>();

  for (const task of tasks) {
    const visual = resolveVisualStatus(
      task.status,
      task.dueDate,
      getDisplayStatus(task),
    );
    if (!filter.has(visual)) continue;

    included.add(task.id);
    let cur: GanttItem | undefined = task;
    while (cur?.parentId && taskIds.has(cur.parentId)) {
      included.add(cur.parentId);
      cur = tasks.find((t) => t.id === cur!.parentId);
    }
  }

  return tasks.filter((t) => included.has(t.id));
}
