import { describe, expect, it } from "vitest";
import {
  buildTimelineLayout,
  dateToX,
  getDateColumnBounds,
  getExecutionFillSpanMetrics,
  getTimelineSpanMetrics,
  ganttInstantToX,
  isDateOnlyPlanInstant,
  scaleTimelineToViewport,
} from "@/lib/gantt-scale";

describe("getDateColumnBounds", () => {
  it("returns one day column in week scale", () => {
    const layout = buildTimelineLayout("week", "2026-06-20");
    const bounds = getDateColumnBounds("2026-06-20", layout);
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBe(36);
  });

  it("snaps open execution span to today column end", () => {
    const layout = buildTimelineLayout("week", "2026-06-20");
    const today = "2026-06-20";
    const bounds = getDateColumnBounds(today, layout)!;
    const metrics = getTimelineSpanMetrics(
      "2026-06-18T00:00:00.000Z",
      "2026-06-20T15:00:00.000Z",
      layout,
      { snapEndToDate: today },
    );
    expect(metrics.left + metrics.width).toBe(bounds.left + bounds.width);
  });
});

describe("execution fill span metrics", () => {
  it("aligns date-only plan end to column right edge", () => {
    const layout = buildTimelineLayout("week", "2026-06-20");
    const planEnd = "2026-06-30T00:00:00.000Z";
    const actualEnd = "2026-07-02T00:00:00.000Z";
    const planBounds = getDateColumnBounds(planEnd, layout)!;
    const actualBounds = getDateColumnBounds(actualEnd, layout)!;
    const metrics = getExecutionFillSpanMetrics(planEnd, actualEnd, layout);
    expect(metrics.left).toBe(planBounds.left + planBounds.width);
    expect(metrics.left + metrics.width).toBe(actualBounds.left + actualBounds.width);
  });

  it("snaps date-only to day end on day scale", () => {
    const layout = buildTimelineLayout("day", "2026-06-30");
    const dayEnd = ganttInstantToX("2026-06-30T00:00:00.000Z", layout);
    const dayStart = dateToX("2026-06-30", layout);
    expect(dayEnd).toBeGreaterThan(dayStart);
    expect(isDateOnlyPlanInstant("2026-06-30T14:30:00.000Z")).toBe(false);
  });
});

describe("scaleTimelineToViewport", () => {
  it("stretches 5year columns with scroll headroom", () => {
    const base = buildTimelineLayout("5year", "2026-06-20");
    expect(base.columns.length).toBe(7);

    const scaled = scaleTimelineToViewport(base, 1000);
    expect(scaled.totalWidth).toBeGreaterThan(1000);
    expect(scaled.columns[0]!.width).toBeGreaterThan(base.columns[0]!.width);
  });

  it("no-op for non-5year scales", () => {
    const base = buildTimelineLayout("month", "2026-06-20");
    const scaled = scaleTimelineToViewport(base, 1000);
    expect(scaled.totalWidth).toBe(base.totalWidth);
  });
});
