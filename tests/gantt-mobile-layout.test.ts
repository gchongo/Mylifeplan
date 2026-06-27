import { describe, expect, it } from "vitest";
import {
  mobilePlanBarCenterPx,
  mobilePlanBarLeftPx,
  mobilePlanBarWidthPx,
  mobilePlanColumnWidth,
  mobilePlanGridWidth,
  MOBILE_ROW_GROUP_GAP,
} from "@/lib/gantt-mobile-layout";
import { buildMobileColumnForkLines } from "@/lib/gantt-mobile-tree-lines";
import { mobileWeekAxisWidthPx } from "@/lib/gantt-mobile-week-axis";
import { formatPlanLocalDateCompactSlash } from "@/lib/dates";

describe("mobilePlanColumnWidth", () => {
  it("uses PC bar height as mobile bar width plus padding", () => {
    expect(mobilePlanBarWidthPx(0)).toBe(30);
    expect(mobilePlanBarWidthPx(1)).toBe(24);
    expect(mobilePlanBarWidthPx(2)).toBe(18);
    expect(mobilePlanColumnWidth(0)).toBe(34);
    expect(mobilePlanBarLeftPx(0)).toBe(2);
    expect(mobilePlanBarCenterPx(0)).toBe(17);
    expect(MOBILE_ROW_GROUP_GAP).toBe(1);
    expect(mobilePlanGridWidth([{ gapBefore: 0, depth: 0 }, { gapBefore: MOBILE_ROW_GROUP_GAP, depth: 0 }])).toBe(
      34 + MOBILE_ROW_GROUP_GAP + 34,
    );
  });

  it("uses compact week axis width", () => {
    expect(mobileWeekAxisWidthPx()).toBe(14);
  });
});

describe("formatPlanLocalDateCompactSlash", () => {
  it("formats as YY/M/D", () => {
    expect(formatPlanLocalDateCompactSlash("2026-04-12T10:00:00.000Z")).toMatch(/^26\/\d+\/\d+$/);
  });
});

describe("buildMobileColumnForkLines", () => {
  it("draws fork lines from parent column to child columns", () => {
    const lines = buildMobileColumnForkLines(
      [
        { itemId: "p1", parentId: null, left: 0, width: 100 },
        { itemId: "c1", parentId: "p1", left: 100, width: 100 },
        { itemId: "c2", parentId: "p1", left: 200, width: 100 },
      ],
      50,
    );
    expect(lines.length).toBeGreaterThan(0);
  });

  it("returns empty when no parent-child groups", () => {
    expect(
      buildMobileColumnForkLines(
        [{ itemId: "a", parentId: null, left: 0, width: 100 }],
        50,
      ),
    ).toEqual([]);
  });
});

describe("buildMobileWeekSpans", () => {
  it("merges consecutive day columns into week spans", async () => {
    const { buildMobileWeekSpans } = await import("@/lib/gantt-mobile-week-axis");
    const columns = [
      { key: "2025-06-23", startDate: "2025-06-23", endDate: "2025-06-23", width: 10, topGroupKey: "", topGroupLabel: "", headerBottom: "23" },
      { key: "2025-06-24", startDate: "2025-06-24", endDate: "2025-06-24", width: 10, topGroupKey: "", topGroupLabel: "", headerBottom: "24" },
      { key: "2025-06-30", startDate: "2025-06-30", endDate: "2025-06-30", width: 10, topGroupKey: "", topGroupLabel: "", headerBottom: "30" },
    ];
    const spans = buildMobileWeekSpans(columns);
    expect(spans).toHaveLength(2);
    expect(spans[0]!.height).toBe(20);
    expect(spans[1]!.height).toBe(10);
  });
});

describe("buildMobileSecondaryAxisSpans", () => {
  it("shows month labels on year scale", async () => {
    const { buildMobileSecondaryAxisSpans } = await import("@/lib/gantt-mobile-week-axis");
    const { buildTimelineLayout } = await import("@/lib/gantt-scale");
    const layout = buildTimelineLayout("year", "2025-06-15", null);
    const spans = buildMobileSecondaryAxisSpans(layout);
    expect(spans.some((s) => s.label === "6月" || s.label === "六月")).toBe(true);
    expect(spans.every((s) => !s.label.includes("周"))).toBe(true);
  });
});
