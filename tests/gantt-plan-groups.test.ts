import { describe, expect, it } from "vitest";
import { buildPlanGroupLayouts, rowOffsetTop } from "@/lib/gantt-plan-groups";

describe("buildPlanGroupLayouts", () => {
  const rows = [
    { rootId: "a", gapBefore: 0, height: 28 },
    { rootId: "a", gapBefore: 0, height: 28 },
    { rootId: "a", gapBefore: 0, height: 28 },
    { rootId: "b", gapBefore: 12, height: 28 },
  ];

  it("groups consecutive rows by rootId", () => {
    const groups = buildPlanGroupLayouts(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ rootId: "a", rowCount: 3, top: 0, height: 84 });
  });

  it("skips single-row groups", () => {
    const groups = buildPlanGroupLayouts([{ rootId: "solo", gapBefore: 0, height: 28 }]);
    expect(groups).toHaveLength(0);
  });

  it("rowOffsetTop sums gap and height", () => {
    expect(rowOffsetTop(rows, 3)).toBe(84);
  });
});
