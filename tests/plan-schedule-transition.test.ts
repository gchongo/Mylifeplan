import { describe, expect, it } from "vitest";
import {
  buildPlanScheduleTransitionPatch,
  normalizeSchedulePatchForApi,
} from "@/lib/plan-schedule-transition";
import type { KanbanPlan } from "@/lib/kanban-board";

const now = new Date("2026-06-20T15:30:00.000Z");

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

describe("buildPlanScheduleTransitionPatch", () => {
  it("unscheduled clears all schedule and actual fields", () => {
    expect(
      buildPlanScheduleTransitionPatch(
        plan({
          id: "1",
          title: "A",
          status: "in_progress",
          startDate: "2026-06-01T09:00:00.000Z",
          endDate: "2026-06-10T18:00:00.000Z",
        }),
        "unscheduled",
        now,
      ),
    ).toEqual({
      status: "not_started",
      startDate: null,
      endDate: null,
      actualStartDate: null,
      actualEndDate: null,
    });
  });

  it("unscheduled to not_started sets start to now", () => {
    const patch = buildPlanScheduleTransitionPatch(plan({ id: "1", title: "A" }), "not_started", now);
    expect(patch.status).toBe("not_started");
    expect(patch.startDate).toBeTruthy();
    expect(patch.endDate).toBeUndefined();
  });

  it("unscheduled to in_progress sets start and actual start", () => {
    const patch = buildPlanScheduleTransitionPatch(plan({ id: "1", title: "A" }), "in_progress", now);
    expect(patch).toMatchObject({
      status: "in_progress",
      actualStartDate: patch.startDate,
    });
  });

  it("unscheduled to done sets all four times to now", () => {
    const patch = buildPlanScheduleTransitionPatch(plan({ id: "1", title: "A" }), "done", now);
    expect(patch).toEqual({
      status: "done",
      startDate: expect.any(String),
      endDate: expect.any(String),
      actualStartDate: expect.any(String),
      actualEndDate: expect.any(String),
    });
    expect(patch.startDate).toBe(patch.endDate);
    expect(patch.actualStartDate).toBe(patch.actualEndDate);
  });

  it("scheduled not_started to done adds end when missing", () => {
    const patch = buildPlanScheduleTransitionPatch(
      plan({ id: "1", title: "A", startDate: "2026-06-01T09:00:00.000Z" }),
      "done",
      now,
    );
    expect(patch.status).toBe("done");
    expect(patch.endDate).toBeTruthy();
    expect(patch.startDate).toBeUndefined();
  });

  it("scheduled not_started to done keeps existing end", () => {
    const patch = buildPlanScheduleTransitionPatch(
      plan({
        id: "1",
        title: "A",
        startDate: "2026-06-01T09:00:00.000Z",
        endDate: "2026-06-15T18:00:00.000Z",
      }),
      "done",
      now,
    );
    expect(patch).toEqual({ status: "done" });
  });

  it("archive only changes status", () => {
    expect(
      buildPlanScheduleTransitionPatch(
        plan({ id: "1", title: "A", startDate: "2026-06-01T09:00:00.000Z" }),
        "archived",
        now,
      ),
    ).toEqual({ status: "archived" });
  });

  it("blocks unscheduled when plan has contributions", () => {
    expect(() =>
      buildPlanScheduleTransitionPatch(
        plan({ id: "1", title: "A", contributionCount: 1, startDate: "2026-06-01" }),
        "unscheduled",
        now,
      ),
    ).toThrow(/贡献/);
  });
});

describe("normalizeSchedulePatchForApi", () => {
  it("converts datetime-local fields to ISO", () => {
    const body = normalizeSchedulePatchForApi({
      status: "in_progress",
      startDate: "2026-06-20T15:30",
      actualStartDate: "2026-06-20T15:30",
    });
    expect(body.startDate).toMatch(/2026-06-20/);
    expect(body.actualStartDate).toMatch(/2026-06-20/);
  });
});
