import { describe, expect, it } from "vitest";
import {
  buildBoundGroupPreview,
  clampPlanStartToParent,
  collectDescendantPlans,
  shiftPlanDatesByDays,
} from "@/lib/gantt-plan-bind";
import type { GanttItem } from "@/types";

const items: GanttItem[] = [
  {
    id: "root",
    title: "Root",
    startDate: "2026-01-01",
    effectiveEnd: "2026-01-10",
    isVirtualEnd: false,
    parentId: null,
  },
  {
    id: "c1",
    title: "C1",
    startDate: "2026-01-03",
    effectiveEnd: "2026-01-05",
    isVirtualEnd: false,
    parentId: "root",
  },
  {
    id: "c2",
    title: "C2",
    startDate: "2026-01-04",
    effectiveEnd: "2026-01-06",
    isVirtualEnd: false,
    parentId: "c1",
  },
];

describe("gantt-plan-bind", () => {
  it("collects nested descendants", () => {
    expect(collectDescendantPlans("root", items).map((p) => p.id)).toEqual(["c1", "c2"]);
  });

  it("shifts dates by delta days", () => {
    expect(shiftPlanDatesByDays(items[1]!, 2)).toEqual({
      start: "2026-01-05",
      end: "2026-01-07",
    });
  });

  it("builds bound preview for root and children", () => {
    const preview = buildBoundGroupPreview(
      items[0]!,
      { start: "2026-01-05", end: "2026-01-14" },
      items,
    );
    expect(preview.get("root")).toEqual({ start: "2026-01-05", end: "2026-01-14" });
    expect(preview.get("c1")).toEqual({ start: "2026-01-07", end: "2026-01-09" });
    expect(preview.get("c2")).toEqual({ start: "2026-01-08", end: "2026-01-10" });
  });

  it("clamps child start to parent start", () => {
    expect(clampPlanStartToParent("2026-01-01", "2026-01-05")).toBe("2026-01-05");
    expect(clampPlanStartToParent("2026-01-06", "2026-01-05")).toBe("2026-01-06");
  });
});
