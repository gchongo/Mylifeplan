import { describe, expect, it } from "vitest";
import {
  isPlanOverdue,
  isSubPlanOverdueAgainstParent,
  planOverdueNode,
  getActiveSubPlanOverrunTail,
  getParentRolledUpOverrunTail,
} from "@/lib/gantt-plan-status";
import type { GanttItem } from "@/types";

function plan(
  partial: Pick<GanttItem, "id"> &
    Partial<Pick<GanttItem, "status" | "endDate" | "isVirtualEnd" | "parentId">>,
): GanttItem {
  return {
    id: partial.id,
    title: partial.id,
    startDate: "2026-01-01",
    effectiveEnd: partial.endDate ?? "2026-12-31",
    isVirtualEnd: partial.isVirtualEnd ?? false,
    endDate: partial.endDate,
    parentId: partial.parentId,
    status: partial.status ?? "not_started",
  };
}

describe("isPlanOverdue", () => {
  it("returns false for virtual end plans", () => {
    const item = plan({ id: "a", isVirtualEnd: true, endDate: "2026-12-31" });
    expect(isPlanOverdue(item, new Map())).toBe(false);
  });

  it("marks child overdue when end is after parent end", () => {
    const parent = plan({ id: "root", endDate: "2026-06-01T12:00" });
    const child = plan({
      id: "child",
      parentId: "root",
      endDate: "2026-06-01T14:30",
      status: "in_progress",
    });
    const byId = new Map([
      ["root", parent],
      ["child", child],
    ]);
    expect(isPlanOverdue(child, byId)).toBe(true);
  });

  it("does not mark child overdue when end is before parent end", () => {
    const parent = plan({ id: "root", endDate: "2026-12-31T23:59" });
    const child = plan({
      id: "child",
      parentId: "root",
      endDate: "2026-01-01T00:00",
      status: "not_started",
    });
    const byId = new Map([
      ["root", parent],
      ["child", child],
    ]);
    expect(isPlanOverdue(child, byId)).toBe(false);
  });

  it("does not mark done child as overdue", () => {
    const parent = plan({ id: "root", endDate: "2026-06-01T12:00" });
    const child = plan({
      id: "child",
      parentId: "root",
      endDate: "2026-06-02T12:00",
      status: "done",
    });
    const byId = new Map([
      ["root", parent],
      ["child", child],
    ]);
    expect(isPlanOverdue(child, byId)).toBe(false);
  });

  it("root plan is never overdue", () => {
    const root = plan({ id: "root", endDate: "2020-01-01T00:00" });
    expect(isPlanOverdue(root, new Map([["root", root]]))).toBe(false);
  });
});

describe("overrun tails", () => {
  it("active child gets tail from parent end to child end", () => {
    const parent = plan({ id: "root", endDate: "2026-06-01T12:00" });
    const child = plan({
      id: "child",
      parentId: "root",
      endDate: "2026-06-02T12:00",
      status: "in_progress",
    });
    const byId = new Map([
      ["root", parent],
      ["child", child],
    ]);
    expect(getActiveSubPlanOverrunTail(child, byId)).toEqual({
      from: "2026-06-01T12:00",
      to: "2026-06-02T12:00",
    });
  });

  it("done child rolls overrun up to parent tail", () => {
    const parent = plan({ id: "root", endDate: "2026-06-01T12:00" });
    const child = plan({
      id: "child",
      parentId: "root",
      endDate: "2026-06-03T12:00",
      status: "done",
    });
    const items = [parent, child];
    expect(getActiveSubPlanOverrunTail(child, new Map(items.map((p) => [p.id, p])))).toBeNull();
    expect(getParentRolledUpOverrunTail(parent, items)).toEqual({
      from: "2026-06-01T12:00",
      to: "2026-06-03T12:00",
    });
  });

  it("parent has no tail when done child finishes within parent end", () => {
    const parent = plan({ id: "root", endDate: "2026-06-10T12:00" });
    const child = plan({
      id: "child",
      parentId: "root",
      endDate: "2026-06-05T12:00",
      status: "done",
    });
    const items = [parent, child];
    expect(getParentRolledUpOverrunTail(parent, items)).toBeNull();
  });
});

describe("isSubPlanOverdueAgainstParent", () => {
  it("compares minute precision", () => {
    const parent = planOverdueNode({
      startDate: "2026-06-01T09:00",
      endDate: "2026-06-01T12:00",
    });
    const child = planOverdueNode({
      status: "in_progress",
      startDate: "2026-06-01T09:00",
      endDate: "2026-06-01T12:01",
    });
    expect(isSubPlanOverdueAgainstParent(child, parent)).toBe(true);
  });
});
