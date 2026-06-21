import { describe, expect, it } from "vitest";
import { buildParentChildForkLines } from "@/lib/gantt-tree-lines";

describe("gantt-tree-lines", () => {
  it("draws parent to direct child forks only", () => {
    const rows = [
      { itemId: "root", depth: 0, parentId: null, top: 0, height: 36, barLeft: 80 },
      { itemId: "a", depth: 1, parentId: "root", top: 36, height: 28, barLeft: 120 },
      { itemId: "b", depth: 1, parentId: "root", top: 64, height: 28, barLeft: 160 },
    ];
    const lines = buildParentChildForkLines(rows);
    expect(lines.length).toBeGreaterThan(0);
    const horizontals = lines.filter((l) => l.y1 === l.y2);
    expect(horizontals.length).toBeGreaterThanOrEqual(2);
  });

  it("supports nested parent to grandchild forks", () => {
    const rows = [
      { itemId: "root", depth: 0, parentId: null, top: 0, height: 36, barLeft: 60 },
      { itemId: "mid", depth: 1, parentId: "root", top: 36, height: 28, barLeft: 100 },
      { itemId: "leaf", depth: 2, parentId: "mid", top: 64, height: 28, barLeft: 140 },
    ];
    const lines = buildParentChildForkLines(rows);
    expect(lines.some((l) => l.y1 === 78 && l.y2 === 78)).toBe(true);
  });
});
