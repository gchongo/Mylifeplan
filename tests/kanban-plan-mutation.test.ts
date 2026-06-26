import { describe, expect, it } from "vitest";
import { applyOptimisticKanbanPatch } from "@/lib/kanban-plan-mutation";
import { kanbanColumnForPlan, kanbanPatchForColumn, type KanbanPlan } from "@/lib/kanban-board";

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

describe("applyOptimisticKanbanPatch", () => {
  it("moves scheduled not_started plan to in_progress column", () => {
    const plans = [
      plan({
        id: "p1",
        title: "A",
        status: "not_started",
        startDate: "2026-06-01T09:00:00.000Z",
      }),
    ];
    const patch = kanbanPatchForColumn("in_progress", plans[0]);
    const next = applyOptimisticKanbanPatch(plans, "p1", patch);
    expect(kanbanColumnForPlan(next[0])).toBe("in_progress");
  });

  it("clears dates when moving to unscheduled", () => {
    const plans = [
      plan({
        id: "p1",
        title: "A",
        status: "in_progress",
        startDate: "2026-06-01T09:00:00.000Z",
        endDate: "2026-06-10T18:00:00.000Z",
      }),
    ];
    const patch = kanbanPatchForColumn("unscheduled", plans[0]);
    const next = applyOptimisticKanbanPatch(plans, "p1", patch);
    expect(kanbanColumnForPlan(next[0])).toBe("unscheduled");
    expect(next[0].startDate).toBeNull();
    expect(next[0].endDate).toBeNull();
  });
});
