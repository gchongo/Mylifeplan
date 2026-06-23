import { describe, expect, it } from "vitest";
import {
  computePlanSummary,
  isDeadlineOverdue,
  isEarlyCompleted,
  type SummaryPlanRow,
} from "@/lib/plan-summary";

function plan(partial: Partial<SummaryPlanRow> & Pick<SummaryPlanRow, "id" | "title">): SummaryPlanRow {
  return {
    type: "weekly",
    status: "not_started",
    startDate: null,
    endDate: null,
    actualStartDate: null,
    actualEndDate: null,
    parentPlanId: null,
    ...partial,
  };
}

describe("plan summary", () => {
  it("counts status and type buckets", () => {
    const stats = computePlanSummary(
      [
        plan({ id: "1", title: "A", status: "done", type: "goal" }),
        plan({ id: "2", title: "B", status: "in_progress", type: "weekly" }),
        plan({ id: "3", title: "C", status: "archived", type: "daily" }),
      ],
      { memos: 2, contributions: 5 },
    );

    expect(stats.totals.plans).toBe(3);
    expect(stats.totals.active).toBe(2);
    expect(stats.byStatus.done).toBe(1);
    expect(stats.byType.goal).toBe(1);
    expect(stats.totals.memos).toBe(2);
  });

  it("detects early completion", () => {
    const row = plan({
      id: "1",
      title: "Early",
      status: "done",
      endDate: new Date("2026-06-20T12:00:00.000Z"),
      actualEndDate: new Date("2026-06-18T12:00:00.000Z"),
    });
    expect(isEarlyCompleted(row)).toBe(true);
    const stats = computePlanSummary([row], { memos: 0, contributions: 0 });
    expect(stats.execution.earlyCompleted).toBe(1);
  });

  it("detects deadline overdue for active plans", () => {
    const row = plan({
      id: "1",
      title: "Late",
      status: "in_progress",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-01-10T00:00:00.000Z"),
    });
    const now = new Date("2026-06-20T12:00:00.000Z");
    expect(isDeadlineOverdue(row, now)).toBe(true);
  });
});
