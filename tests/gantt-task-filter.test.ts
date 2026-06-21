import { describe, expect, it } from "vitest";
import {
  defaultGanttStatusFilter,
  filterGanttTasksByStatus,
} from "@/lib/gantt-task-filter";
import { STATUS_LEGEND } from "@/lib/task-status-style";
import type { GanttItem } from "@/types";

const plans: GanttItem[] = [
  {
    id: "p1",
    title: "Parent",
    startDate: "2026-01-01",
    effectiveEnd: "2026-01-10",
    isVirtualEnd: false,
    status: "not_started",
  },
  {
    id: "c1",
    title: "Child done",
    startDate: "2026-01-02",
    effectiveEnd: "2026-01-05",
    isVirtualEnd: false,
    parentId: "p1",
    status: "done",
  },
];

describe("filterGanttTasksByStatus", () => {
  it("keeps parent when child matches filter", () => {
    const result = filterGanttTasksByStatus(
      plans,
      new Set(["done"]),
      (t) => t.status ?? "not_started",
    );
    expect(result.map((t) => t.id).sort()).toEqual(["c1", "p1"]);
  });

  it("returns all when filter includes every status", () => {
    const result = filterGanttTasksByStatus(
      plans,
      new Set(STATUS_LEGEND),
      (t) => t.status ?? "not_started",
    );
    expect(result).toHaveLength(2);
  });

  it("default filter excludes archived", () => {
    const archived: GanttItem = {
      id: "a1",
      title: "Archived",
      startDate: "2026-01-01",
      effectiveEnd: "2026-01-10",
      isVirtualEnd: false,
      status: "archived",
    };
    const result = filterGanttTasksByStatus(
      [...plans, archived],
      defaultGanttStatusFilter(),
      (t) => t.status ?? "not_started",
    );
    expect(result.map((t) => t.id)).not.toContain("a1");
  });

  it("shows archived when filter includes archived", () => {
    const archived: GanttItem = {
      id: "a1",
      title: "Archived",
      startDate: "2026-01-01",
      effectiveEnd: "2026-01-10",
      isVirtualEnd: false,
      status: "archived",
    };
    const result = filterGanttTasksByStatus(
      [...plans, archived],
      new Set([...defaultGanttStatusFilter(), "archived"]),
      (t) => t.status ?? "not_started",
    );
    expect(result.map((t) => t.id)).toContain("a1");
  });
});
