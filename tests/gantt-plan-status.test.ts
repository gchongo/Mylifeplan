import { describe, expect, it } from "vitest";
import { resolveGanttPlanDueDate } from "@/lib/gantt-plan-status";
import type { GanttItem } from "@/types";

function plan(
  partial: Pick<GanttItem, "id"> &
    Partial<Pick<GanttItem, "endDate" | "isVirtualEnd" | "parentId">>,
): GanttItem {
  return {
    id: partial.id,
    title: partial.id,
    startDate: "2026-01-01",
    effectiveEnd: partial.endDate ?? "2026-12-31",
    isVirtualEnd: partial.isVirtualEnd ?? false,
    endDate: partial.endDate,
    parentId: partial.parentId,
  };
}

describe("resolveGanttPlanDueDate", () => {
  it("returns null for virtual end plans", () => {
    const item = plan({ id: "a", isVirtualEnd: true });
    expect(resolveGanttPlanDueDate(item, new Map())).toBeNull();
  });

  it("suppresses child overdue while parent is still active", () => {
    const parent = plan({ id: "root", endDate: "2026-12-31" });
    const child = plan({ id: "child", parentId: "root", endDate: "2026-01-01" });
    const byId = new Map([
      ["root", parent],
      ["child", child],
    ]);
    expect(resolveGanttPlanDueDate(child, byId)).toBeNull();
  });

  it("uses own end date for root plans", () => {
    const root = plan({ id: "root", endDate: "2026-01-01" });
    expect(resolveGanttPlanDueDate(root, new Map([["root", root]]))).toBe("2026-01-01");
  });
});
