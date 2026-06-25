import { describe, expect, it } from "vitest";
import { patchGanttItemFromPlan, applyGanttPlanPatch, mergeGanttItem, serializedPlanToGanttItem } from "@/lib/gantt-plan-sync";
import type { GanttItem } from "@/types";

function baseItem(overrides: Partial<GanttItem> = {}): GanttItem {
  return {
    id: "p1",
    title: "Plan",
    startDate: "2025-01-01T00:00:00.000Z",
    endDate: "2025-06-01T00:00:00.000Z",
    effectiveEnd: "2025-06-01T00:00:00.000Z",
    isVirtualEnd: false,
    status: "not_started",
    ...overrides,
  };
}

describe("patchGanttItemFromPlan", () => {
  it("updates plan dates and effective end", () => {
    const next = patchGanttItemFromPlan(baseItem(), {
      id: "p1",
      startDate: "2025-02-01T00:00:00.000Z",
      endDate: "2025-07-01T00:00:00.000Z",
    });
    expect(next.startDate).toBe("2025-02-01T00:00:00.000Z");
    expect(next.endDate).toBe("2025-07-01T00:00:00.000Z");
    expect(next.effectiveEnd).toBe("2025-07-01");
    expect(next.isVirtualEnd).toBe(false);
  });

  it("recomputes virtual end when due date cleared", () => {
    const next = patchGanttItemFromPlan(baseItem(), {
      id: "p1",
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: null,
    });
    expect(next.endDate).toBeNull();
    expect(next.isVirtualEnd).toBe(true);
    expect(next.effectiveEnd).toBeTruthy();
  });

  it("shifts descendant plan dates", () => {
    const items: GanttItem[] = [
      {
        id: "root",
        title: "Root",
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-02-01T00:00:00.000Z",
        effectiveEnd: "2025-02-01T00:00:00.000Z",
        isVirtualEnd: false,
        status: "not_started",
        parentId: null,
      },
      {
        id: "child",
        title: "Child",
        startDate: "2025-01-10T00:00:00.000Z",
        endDate: "2025-01-20T00:00:00.000Z",
        effectiveEnd: "2025-01-20T00:00:00.000Z",
        isVirtualEnd: false,
        status: "not_started",
        parentId: "root",
      },
    ];
    const next = applyGanttPlanPatch(
      items,
      { id: "root", startDate: "2025-01-08T00:00:00.000Z", endDate: "2025-02-08T00:00:00.000Z" },
      { shiftDescendants: true, previousStart: "2025-01-01T00:00:00.000Z" },
    );
    expect(next.find((item) => item.id === "child")?.startDate).toBe("2025-01-17T00:00:00.000Z");
  });

  it("merges a new plan into gantt items", () => {
    const items = [baseItem()];
    const created = serializedPlanToGanttItem({
      id: "p2",
      title: "Child",
      startDate: "2025-03-01T00:00:00.000Z",
      endDate: "2025-04-01T00:00:00.000Z",
      parentPlanId: "p1",
      status: "not_started",
    });
    expect(created).not.toBeNull();
    const next = mergeGanttItem(items, created!);
    expect(next).toHaveLength(2);
    expect(next.some((item) => item.id === "p2")).toBe(true);
  });
});
