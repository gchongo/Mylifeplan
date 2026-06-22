import { describe, expect, it } from "vitest";
import { buildTimelineLayout, ganttPlanBarMetrics } from "@/lib/gantt-scale";

describe("ganttPlanBarMetrics", () => {
  it("spans full day for date-only plan on day scale", () => {
    const layout = buildTimelineLayout("day", "2026-06-30");
    const metrics = ganttPlanBarMetrics("2026-06-30", "2026-06-30", layout);
    expect(metrics.width).toBeGreaterThan(layout.totalWidth / 8);
  });

  it("uses hour-minute width for datetime plan on day scale", () => {
    const layout = buildTimelineLayout("day", "2026-06-30");
    const fullDay = ganttPlanBarMetrics("2026-06-30", "2026-06-30", layout).width;
    const twoHours = ganttPlanBarMetrics(
      "2026-06-30T10:00:00",
      "2026-06-30T12:00:00",
      layout,
    ).width;
    expect(twoHours).toBeLessThan(fullDay);
    expect(twoHours).toBeGreaterThan(56);
  });

  it("occupies full day column on week scale for datetime same day", () => {
    const layout = buildTimelineLayout("week", "2026-06-30");
    const metrics = ganttPlanBarMetrics(
      "2026-06-30T10:30:00",
      "2026-06-30T14:00:00",
      layout,
    );
    expect(metrics.width).toBe(36);
  });
});
