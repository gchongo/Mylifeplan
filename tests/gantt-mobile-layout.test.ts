import { describe, expect, it } from "vitest";
import {
  mobilePlanBarCenterPx,
  mobilePlanBarLeftPx,
  mobilePlanBarWidthPx,
  mobilePlanColumnWidth,
  mobilePlanGridWidth,
} from "@/lib/gantt-mobile-layout";
import { buildMobileColumnForkLines } from "@/lib/gantt-mobile-tree-lines";

describe("mobilePlanColumnWidth", () => {
  it("matches PC bar height plus padding", () => {
    expect(mobilePlanBarWidthPx(0)).toBe(30);
    expect(mobilePlanColumnWidth(0)).toBe(38);
    expect(mobilePlanBarLeftPx(0)).toBe(4);
    expect(mobilePlanBarCenterPx(0)).toBe(19);
    expect(mobilePlanGridWidth([{ gapBefore: 0, depth: 0 }, { gapBefore: 8, depth: 0 }])).toBe(
      38 + 8 + 38,
    );
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
