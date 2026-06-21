import { describe, expect, it } from "vitest";
import {
  contributionsForGanttRow,
  findRootPlanId,
  isPlanInSameRootSubtree,
  resolveContributionDisplayPlanId,
} from "@/lib/gantt-contribution-display";
import type { GanttItem } from "@/types";

const plans: GanttItem[] = [
  {
    id: "root",
    title: "Root",
    startDate: "2026-01-01",
    effectiveEnd: "2026-12-31",
    isVirtualEnd: false,
    parentId: null,
  },
  {
    id: "child",
    title: "Child",
    startDate: "2026-02-01",
    effectiveEnd: "2026-02-28",
    isVirtualEnd: false,
    parentId: "root",
  },
];

function planMap(items: GanttItem[]) {
  return new Map(items.map((p) => [p.id, p]));
}

describe("gantt-contribution-display", () => {
  it("finds root plan id", () => {
    expect(findRootPlanId("child", planMap(plans))).toBe("root");
  });

  it("shows contribution on child row when expanded", () => {
    const expanded = new Set(["root"]);
    const visible = new Set(["root", "child"]);
    expect(
      resolveContributionDisplayPlanId("child", planMap(plans), expanded, visible),
    ).toBe("child");
  });

  it("rolls up contribution to parent when child row hidden", () => {
    const expanded = new Set<string>();
    const visible = new Set(["root"]);
    expect(
      resolveContributionDisplayPlanId("child", planMap(plans), expanded, visible),
    ).toBe("root");
  });

  it("filters contributions for a row", () => {
    const expanded = new Set(["root"]);
    const visible = new Set(["root", "child"]);
    const contribs = [
      {
        id: "c1",
        planId: "child",
        title: "A",
        occurredOn: "2026-02-10",
      },
      {
        id: "c2",
        planId: "root",
        title: "B",
        occurredOn: "2026-01-10",
      },
    ];
    const childRow = contributionsForGanttRow(
      "child",
      contribs,
      planMap(plans),
      expanded,
      visible,
    );
    expect(childRow.map((c) => c.id)).toEqual(["c1"]);
    const rootRow = contributionsForGanttRow(
      "root",
      contribs,
      planMap(plans),
      expanded,
      visible,
    );
    expect(rootRow.map((c) => c.id)).toEqual(["c2"]);
  });

  it("checks same root subtree for reassignment", () => {
    expect(isPlanInSameRootSubtree("child", "root", plans)).toBe(true);
    expect(
      isPlanInSameRootSubtree(
        "child",
        "other",
        [
          ...plans,
          {
            id: "other",
            title: "Other",
            startDate: "2026-01-01",
            effectiveEnd: "2026-01-02",
            isVirtualEnd: false,
            parentId: null,
          },
        ],
      ),
    ).toBe(false);
  });
});
