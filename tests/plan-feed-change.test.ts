import { describe, expect, it } from "vitest";
import {
  describePlanChanges,
  formatFeedPlanDateChinese,
  parsePlanFeedContent,
  planToFeedSnapshot,
  serializePlanFeedChanges,
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
  it("includes before and after for end date", () => {
    const before = planToFeedSnapshot(base);
    const after = planToFeedSnapshot({
      ...base,
      endDate: new Date("2026-06-26T00:00:00.000Z"),
    });
    const changes = describePlanChanges(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].label).toBe("截至时间");
    expect(changes[0].before).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);
    expect(changes[0].after).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);
    expect(changes[0].before).not.toBe(changes[0].after);
  });

  it("tracks multiple fields", () => {
    const before = planToFeedSnapshot(base);
    const after = planToFeedSnapshot({
      ...base,
      title: "新标题",
      status: "in_progress",
    });
    const changes = describePlanChanges(before, after);
    expect(changes.map((c) => c.label)).toEqual(["标题", "状态"]);
    expect(changes[0]).toEqual({ label: "标题", before: "学习计划", after: "新标题" });
    expect(changes[1]).toEqual({
      label: "状态",
      before: "未开始",
      after: "进行中",
    });
  });
});

describe("parsePlanFeedContent", () => {
  it("ignores legacy title-only content", () => {
    expect(parsePlanFeedContent("学习计划", "学习计划")).toEqual({
      changes: null,
      legacySummary: null,
    });
  });

  it("round-trips structured changes", () => {
    const before = planToFeedSnapshot(base);
    const after = planToFeedSnapshot({
      ...base,
      endDate: new Date("2026-06-26T00:00:00.000Z"),
    });
    const changes = describePlanChanges(before, after);
    const raw = serializePlanFeedChanges(changes);
    expect(parsePlanFeedContent(raw, "学习计划")).toEqual({
      changes,
      legacySummary: null,
    });
  });

  it("falls back to legacy plain text", () => {
    expect(parsePlanFeedContent("更新了截至时间为2026年6月26日", "学习计划")).toEqual({
      changes: null,
      legacySummary: "更新了截至时间为2026年6月26日",
    });
  });
});

describe("formatFeedPlanDateChinese", () => {
  it("formats date without time", () => {
    expect(formatFeedPlanDateChinese(new Date("2026-06-26T00:00:00.000Z"))).toMatch(
      /2026年6月26日/,
    );
  });
});
