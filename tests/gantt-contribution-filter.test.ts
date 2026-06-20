import { describe, expect, it } from "vitest";

/** 与 getGanttData 返回前相同的贡献过滤规则 */
function filterContributionsForGanttItems<
  T extends { id: string },
  C extends { planId: string },
>(items: T[], contributions: C[]): C[] {
  const visiblePlanIds = new Set(items.map((i) => i.id));
  return contributions.filter((c) => visiblePlanIds.has(c.planId));
}

describe("gantt contribution visibility", () => {
  it("hides contributions when plan is not on the gantt timeline", () => {
    const items = [{ id: "plan-a", startDate: "2026-06-01" }];
    const contributions = [
      { id: "c1", planId: "plan-a", occurredOn: "2026-06-10" },
      { id: "c2", planId: "plan-b", occurredOn: "2026-06-12" },
    ];
    const filtered = filterContributionsForGanttItems(items, contributions);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].planId).toBe("plan-a");
  });
});
