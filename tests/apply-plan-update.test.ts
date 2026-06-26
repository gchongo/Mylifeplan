import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

let testClient: QueryClient;

vi.mock("@/lib/query/client", () => ({
  getQueryClient: () => testClient,
}));

import { applyPlanUpdateToCache, toGanttPlanSnapshot } from "@/lib/query/apply-plan-update";
import { queryKeys } from "@/lib/query/keys";
import type { KanbanPlan } from "@/lib/kanban-board";
import type { GanttItem } from "@/types";

function kanbanPlan(partial: Partial<KanbanPlan> & Pick<KanbanPlan, "id" | "title">): KanbanPlan {
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

function ganttItem(partial: Partial<GanttItem> & Pick<GanttItem, "id" | "title" | "startDate">): GanttItem {
  return {
    effectiveEnd: partial.effectiveEnd ?? partial.endDate ?? partial.startDate,
    isVirtualEnd: partial.isVirtualEnd ?? false,
    status: partial.status ?? "in_progress",
    ...partial,
  };
}

describe("applyPlanUpdateToCache", () => {
  beforeEach(() => {
    testClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("updates gantt status when reverting in_progress to not_started", () => {
    const planId = "p1";
    testClient.setQueryData(queryKeys.plans.list(), {
      plans: [
        kanbanPlan({
          id: planId,
          title: "Task",
          status: "in_progress",
          startDate: "2026-06-01T09:00:00.000Z",
        }),
      ],
    });

    const ganttKey = queryKeys.gantt.range("2026-01-01", "2026-12-31");
    testClient.setQueryData(ganttKey, {
      items: [
        ganttItem({
          id: planId,
          title: "Task",
          startDate: "2026-06-01T09:00:00.000Z",
          status: "in_progress",
          actualStartDate: "2026-06-05T10:00:00.000Z",
        }),
      ],
      contributions: [],
    });

    applyPlanUpdateToCache({
      id: planId,
      title: "Task",
      status: "not_started",
      startDate: "2026-06-01T09:00:00.000Z",
      endDate: null,
      actualStartDate: null,
      actualEndDate: null,
      parentPlanId: null,
      color: null,
    });

    const gantt = testClient.getQueryData<{ items: GanttItem[] }>(ganttKey);
    expect(gantt?.items[0].status).toBe("not_started");
    expect(gantt?.items[0].actualStartDate).toBeNull();
  });

  it("updates kanban and gantt immediately when reverting in_progress to not_started", () => {
    const planId = "p1";
    testClient.setQueryData(queryKeys.plans.list(), {
      plans: [
        kanbanPlan({
          id: planId,
          title: "Task",
          status: "in_progress",
          startDate: "2026-06-01T09:00:00.000Z",
          endDate: "2026-06-10T18:00:00.000Z",
        }),
      ],
    });

    const ganttKey = queryKeys.gantt.range("2026-01-01", "2026-12-31");
    testClient.setQueryData(ganttKey, {
      items: [
        ganttItem({
          id: planId,
          title: "Task",
          startDate: "2026-06-01T09:00:00.000Z",
          endDate: "2026-06-10T18:00:00.000Z",
          status: "in_progress",
          actualStartDate: "2026-06-05T10:00:00.000Z",
        }),
      ],
      contributions: [],
    });

    applyPlanUpdateToCache({
      id: planId,
      title: "Task",
      status: "not_started",
      startDate: "2026-06-01T09:00:00.000Z",
      endDate: "2026-06-10T18:00:00.000Z",
      actualStartDate: null,
      actualEndDate: null,
      parentPlanId: null,
      color: null,
    });

    const plans = testClient.getQueryData<{ plans: KanbanPlan[] }>(queryKeys.plans.list());
    expect(plans?.plans[0].status).toBe("not_started");

    const gantt = testClient.getQueryData<{ items: GanttItem[] }>(ganttKey);
    expect(gantt?.items[0].status).toBe("not_started");
    expect(gantt?.items[0].actualStartDate).toBeNull();
    expect(gantt?.items[0].actualEndDate).toBeNull();
  });

  it("toGanttPlanSnapshot maps API plan fields", () => {
    expect(
      toGanttPlanSnapshot({
        id: "x",
        title: "T",
        status: "done",
        startDate: "2026-01-01",
        endDate: null,
        actualStartDate: null,
        actualEndDate: null,
      }).status,
    ).toBe("done");
  });
});
