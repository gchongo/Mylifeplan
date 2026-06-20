import { describe, expect, it } from "vitest";
import { filterGanttTasksByStatus } from "@/lib/gantt-task-filter";
import type { GanttItem } from "@/types";

const tasks: GanttItem[] = [
  {
    id: "p1",
    title: "Parent",
    startDate: "2026-01-01",
    effectiveEnd: "2026-01-10",
    isVirtualEnd: false,
    type: "task",
    status: "todo",
  },
  {
    id: "c1",
    title: "Child done",
    startDate: "2026-01-02",
    effectiveEnd: "2026-01-05",
    isVirtualEnd: false,
    type: "task",
    parentId: "p1",
    status: "done",
  },
];

describe("filterGanttTasksByStatus", () => {
  it("keeps parent when child matches filter", () => {
    const result = filterGanttTasksByStatus(
      tasks,
      new Set(["done"]),
      (t) => t.status ?? "todo",
    );
    expect(result.map((t) => t.id).sort()).toEqual(["c1", "p1"]);
  });

  it("returns all when filter includes every status", () => {
    const result = filterGanttTasksByStatus(
      tasks,
      new Set(["todo", "in_progress", "done", "overdue", "archived"]),
      (t) => t.status ?? "todo",
    );
    expect(result).toHaveLength(2);
  });
});
