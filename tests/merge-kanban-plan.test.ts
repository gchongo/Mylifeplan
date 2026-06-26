import { describe, expect, it } from "vitest";
import { kanbanColumnForPlan, type KanbanPlan } from "@/lib/kanban-board";
import { mergeServerPlanIntoKanban, upsertKanbanPlanInList } from "@/lib/query/merge-kanban-plan";

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

describe("merge-kanban-plan", () => {
  it("merges server status into existing kanban row", () => {
    const existing = plan({
      id: "p1",
      title: "Task",
      status: "not_started",
      startDate: "2026-06-01T09:00:00.000Z",
      contributionCount: 2,
    });
    const merged = mergeServerPlanIntoKanban(existing, {
      id: "p1",
      title: "Task",
      status: "in_progress",
      startDate: "2026-06-01T09:00:00.000Z",
      endDate: null,
    });
    expect(merged.status).toBe("in_progress");
    expect(merged.contributionCount).toBe(2);
    expect(kanbanColumnForPlan(merged)).toBe("in_progress");
  });

  it("upserts server plan into list", () => {
    const list = [
      plan({
        id: "p1",
        title: "A",
        status: "not_started",
        startDate: "2026-06-01T09:00:00.000Z",
      }),
    ];
    const next = upsertKanbanPlanInList(list, {
      id: "p1",
      title: "A",
      status: "in_progress",
      startDate: "2026-06-01T09:00:00.000Z",
    });
    expect(kanbanColumnForPlan(next[0])).toBe("in_progress");
  });
});
