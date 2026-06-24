import { describe, expect, it } from "vitest";
import {
  describePlanChanges,
  formatFeedPlanDateChinese,
  joinPlanFeedChanges,
  planToFeedSnapshot,
  resolvePlanFeedUpdateSummary,
} from "@/lib/plan-feed-change";

const base = {
  title: "学习计划",
  description: null,
  startDate: new Date("2026-06-20T00:00:00.000Z"),
  endDate: new Date("2026-06-25T00:00:00.000Z"),
  actualStartDate: null,
  actualEndDate: null,
  status: "not_started" as const,
  type: "weekly" as const,
  priority: null,
  color: null,
  parentPlanId: null,
};

describe("describePlanChanges", () => {
  it("describes end date change in Chinese", () => {
    const before = planToFeedSnapshot(base);
    const after = planToFeedSnapshot({
      ...base,
      endDate: new Date("2026-06-26T00:00:00.000Z"),
    });
    expect(joinPlanFeedChanges(describePlanChanges(before, after))).toMatch(
      /更新了截至时间为\d{4}年\d{1,2}月\d{1,2}日/,
    );
  });

  it("joins multiple changes", () => {
    const before = planToFeedSnapshot(base);
    const after = planToFeedSnapshot({
      ...base,
      title: "新标题",
      status: "in_progress",
    });
    const text = joinPlanFeedChanges(describePlanChanges(before, after));
    expect(text).toContain("更新了标题为「新标题」");
    expect(text).toContain("更新了状态为进行中");
  });
});

describe("resolvePlanFeedUpdateSummary", () => {
  it("ignores legacy title-only content", () => {
    expect(resolvePlanFeedUpdateSummary("学习计划", "学习计划")).toBeNull();
  });

  it("returns update summary text", () => {
    expect(resolvePlanFeedUpdateSummary("更新了截至时间为2026年6月26日", "学习计划")).toBe(
      "更新了截至时间为2026年6月26日",
    );
  });
});

describe("formatFeedPlanDateChinese", () => {
  it("formats date without time", () => {
    expect(formatFeedPlanDateChinese(new Date("2026-06-26T00:00:00.000Z"))).toMatch(
      /2026年6月26日/,
    );
  });
});
