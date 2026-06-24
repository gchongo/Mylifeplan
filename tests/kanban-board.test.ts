import { describe, expect, it } from "vitest";
import {
  groupPlansByKanbanColumn,
  kanbanCanMoveToUnscheduled,
  kanbanColumnForPlan,
  kanbanArchivePatch,
  kanbanPatchForColumn,
  kanbanRestorePatch,
  kanbanVisualForColumn,
  kanbanVisualForZone,
  type KanbanPlan,
} from "@/lib/kanban-board";

function plan(partial: Partial<KanbanPlan> & Pick<KanbanPlan, "id" | "title">): KanbanPlan {
  return {
    description: null,
    type: "goal",
    status: "not_started",
    startDate: null,
    endDate: null,
    parentPlanId: null,
    parentTitle: null,
    childStatuses: [],
    contributionCount: 0,
    ...partial,
  };
}

describe("kanban-board", () => {
  it("memo plan goes to unscheduled", () => {
    expect(kanbanColumnForPlan(plan({ id: "1", title: "A" }))).toBe("unscheduled");
  });

  it("scheduled not_started goes to not_started column", () => {
    expect(
      kanbanColumnForPlan(
        plan({ id: "1", title: "A", startDate: "2026-06-20T08:00:00.000Z" }),
      ),
    ).toBe("not_started");
  });

  it("done status goes to done even without dates", () => {
    expect(kanbanColumnForPlan(plan({ id: "1", title: "A", status: "done" }))).toBe("done");
  });

  it("patch for not_started adds start date when missing", () => {
    const patch = kanbanPatchForColumn("not_started", plan({ id: "1", title: "A" }));
    expect(patch.status).toBe("not_started");
    expect(patch.startDate).toBeTruthy();
  });

  it("patch for unscheduled clears dates", () => {
    const patch = kanbanPatchForColumn(
      "unscheduled",
      plan({ id: "1", title: "A", startDate: "2026-06-20T08:00:00.000Z" }),
    );
    expect(patch.startDate).toBeNull();
    expect(patch.endDate).toBeNull();
  });

  it("groups plans into columns", () => {
    const groups = groupPlansByKanbanColumn([
      plan({ id: "1", title: "Memo" }),
      plan({ id: "2", title: "Scheduled", startDate: "2026-06-20T08:00:00.000Z" }),
    ]);
    expect(groups.unscheduled).toHaveLength(1);
    expect(groups.not_started).toHaveLength(1);
  });

  it("maps unscheduled column to unscheduled visual", () => {
    expect(kanbanVisualForColumn("unscheduled")).toBe("unscheduled");
    expect(kanbanVisualForColumn("not_started")).toBe("todo");
    expect(kanbanVisualForColumn("in_progress")).toBe("in_progress");
    expect(kanbanVisualForColumn("done")).toBe("done");
    expect(kanbanVisualForZone("archived")).toBe("archived");
  });

  it("archives and restores via patch helpers", () => {
    const p = plan({ id: "1", title: "A", startDate: "2026-06-20T08:00:00.000Z" });
    expect(kanbanArchivePatch()).toEqual({ status: "archived" });
    expect(kanbanRestorePatch("not_started", p).status).toBe("not_started");
  });

  it("blocks move to unscheduled when plan has contributions", () => {
    expect(
      kanbanCanMoveToUnscheduled(plan({ id: "1", title: "A", contributionCount: 2 })),
    ).toBe(false);
    expect(() =>
      kanbanPatchForColumn(
        "unscheduled",
        plan({ id: "1", title: "A", contributionCount: 1, startDate: "2026-06-01" }),
      ),
    ).toThrow(/贡献/);
  });
});
