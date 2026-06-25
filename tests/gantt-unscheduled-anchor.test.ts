import { describe, expect, it } from "vitest";
import { planTreeDepth, resolveUnscheduledGanttAnchor } from "@/lib/gantt-unscheduled-anchor";

describe("resolveUnscheduledGanttAnchor", () => {
  const rows = new Map([
    ["root", { id: "root", parentPlanId: null, startDate: "2025-06-01T00:00:00.000Z" }],
    ["mid", { id: "mid", parentPlanId: "root", startDate: null }],
    ["leaf", { id: "leaf", parentPlanId: "mid", startDate: null }],
  ]);

  it("inherits scheduled parent start date", () => {
    const anchor = resolveUnscheduledGanttAnchor(
      "root",
      rows,
      new Map(),
      "2025-01-01T00:00:00.000Z",
    );
    expect(anchor).toBe("2025-06-01T00:00:00.000Z");
  });

  it("inherits computed anchor from unscheduled parent", () => {
    const computed = new Map([["mid", "2025-06-01T00:00:00.000Z"]]);
    const anchor = resolveUnscheduledGanttAnchor(
      "mid",
      rows,
      computed,
      "2025-01-01T00:00:00.000Z",
    );
    expect(anchor).toBe("2025-06-01T00:00:00.000Z");
  });

  it("walks up to scheduled grandparent", () => {
    const anchor = resolveUnscheduledGanttAnchor(
      "mid",
      rows,
      new Map(),
      "2025-01-01T00:00:00.000Z",
    );
    expect(anchor).toBe("2025-06-01T00:00:00.000Z");
  });

  it("sorts by tree depth", () => {
    expect(planTreeDepth("leaf", rows)).toBe(2);
    expect(planTreeDepth("mid", rows)).toBe(1);
  });
});
