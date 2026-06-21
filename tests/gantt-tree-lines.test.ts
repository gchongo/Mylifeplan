import { describe, expect, it } from "vitest";
import { buildParentChildForkLines } from "@/lib/gantt-tree-lines";

describe("gantt-tree-lines", () => {
  it("anchors fork lines near bar start positions, not timeline origin", () => {
    const rows = [
      { itemId: "root", depth: 0, parentId: null, top: 0, height: 36, barLeft: 400 },
      { itemId: "a", depth: 1, parentId: "root", top: 36, height: 28, barLeft: 460 },
      { itemId: "b", depth: 1, parentId: "root", top: 64, height: 28, barLeft: 520 },
    ];
    const lines = buildParentChildForkLines(rows);
    expect(lines.every((l) => l.x1 >= 380 && l.x2 >= 380)).toBe(true);
    const horizontals = lines.filter((l) => l.y1 === l.y2);
    expect(horizontals.length).toBeGreaterThanOrEqual(2);
  });

  it("supports nested parent to grandchild forks at nested bar positions", () => {
    const rows = [
      { itemId: "root", depth: 0, parentId: null, top: 0, height: 36, barLeft: 200 },
      { itemId: "mid", depth: 1, parentId: "root", top: 36, height: 28, barLeft: 280 },
      { itemId: "leaf", depth: 2, parentId: "mid", top: 64, height: 28, barLeft: 340 },
    ];
    const lines = buildParentChildForkLines(rows);
    expect(lines.some((l) => l.x1 >= 260 && l.y1 === 78 && l.y2 === 78)).toBe(true);
    expect(lines.every((l) => l.x1 >= 180)).toBe(true);
  });
});
