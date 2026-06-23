import { describe, expect, it } from "vitest";
import { formatCompletionPercent, planCompletionPercent } from "@/lib/gantt-plan-completion";
import type { GanttItem } from "@/types";

function item(partial: Partial<GanttItem> & Pick<GanttItem, "id" | "title">): GanttItem {
  return {
    startDate: "2026-01-01T00:00:00.000Z",
    effectiveEnd: "2026-12-31T00:00:00.000Z",
    isVirtualEnd: true,
    ...partial,
  };
}

describe("planCompletionPercent", () => {
  it("returns child rollup ratio", () => {
    const plans = [
      item({ id: "p", title: "Parent", status: "in_progress" }),
      item({ id: "c1", title: "A", parentId: "p", status: "done" }),
      item({ id: "c2", title: "B", parentId: "p", status: "not_started" }),
    ];
    expect(planCompletionPercent(plans[0]!, plans)).toBe(50);
  });

  it("returns 100/0 for leaf done/not_started", () => {
    const plans = [
      item({ id: "d", title: "Done", status: "done" }),
      item({ id: "n", title: "New", status: "not_started" }),
    ];
    expect(planCompletionPercent(plans[0]!, plans)).toBe(100);
    expect(planCompletionPercent(plans[1]!, plans)).toBe(0);
  });

  it("returns null for in_progress leaf (no duplicate status text)", () => {
    const plans = [item({ id: "x", title: "Wip", status: "in_progress" })];
    expect(planCompletionPercent(plans[0]!, plans)).toBeNull();
    expect(formatCompletionPercent(null)).toBe("—");
  });
});
