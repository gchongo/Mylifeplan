import { describe, expect, it } from "vitest";
import { buildMobilePlanBarForkLineGroups } from "@/lib/gantt-mobile-tree-lines";

describe("buildMobilePlanBarForkLineGroups", () => {
  it("anchors fork lines at plan bar tops, not header row", () => {
    const groups = buildMobilePlanBarForkLineGroups([
      { itemId: "p1", parentId: null, left: 0, width: 38, barTop: 120 },
      { itemId: "c1", parentId: "p1", left: 46, width: 38, barTop: 180 },
      { itemId: "c2", parentId: "p1", left: 84, width: 38, barTop: 220 },
    ]);

    expect(groups).toHaveLength(1);
    const lines = groups[0]!.lines;
    expect(lines.some((l) => l.y1 >= 100 && l.y2 >= 100)).toBe(true);
    expect(lines.every((l) => l.y1 !== 10 && l.y2 !== 10)).toBe(true);
  });

  it("draws horizontal branch between child columns", () => {
    const groups = buildMobilePlanBarForkLineGroups([
      { itemId: "p1", parentId: null, left: 0, width: 38, barTop: 50 },
      { itemId: "c1", parentId: "p1", left: 46, width: 38, barTop: 100 },
    ]);

    const horizontals = groups[0]!.lines.filter((l) => l.y1 === l.y2);
    expect(horizontals.length).toBeGreaterThan(0);
  });
});
