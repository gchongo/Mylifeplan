import { describe, expect, it } from "vitest";
import {
  buildTimelineLayout,
  dateToX,
  getDateColumnBounds,
  getExecutionFillSpanMetrics,
  getExecutionLineSpanMetrics,
  getTimelineSpanMetrics,
  ganttActualVisualEndX,
  ganttInstantToX,
  ganttPlanBarMetrics,
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
  it("aligns overdue red span from plan bar end to actual completion", () => {
    const layout = buildTimelineLayout("week", "2026-06-20");
    const planEnd = "2026-06-30T00:00:00.000Z";
    const actualEnd = "2026-07-02T00:00:00.000Z";
    const bar = ganttPlanBarMetrics("2026-06-01", planEnd, layout);
    const metrics = getExecutionFillSpanMetrics(planEnd, actualEnd, layout, {
      fromEndpoint: "plan",
      toEndpoint: "actual",
    });
    expect(metrics.left).toBe(bar.left + bar.width);
    const line = getExecutionLineSpanMetrics("2026-06-01T09:00:00.000Z", actualEnd, layout);
    expect(metrics.left + metrics.width).toBe(line.left + line.width);
  });

  it("aligns early-completion green end with plan bar end on week scale", () => {
    const layout = buildTimelineLayout("week", "2026-06-20");
    const planEnd = "2026-06-30T00:00:00.000Z";
    const actualEnd = "2026-06-20T15:30:00.000Z";
    const bar = ganttPlanBarMetrics("2026-06-01", planEnd, layout);
    const metrics = getExecutionFillSpanMetrics(actualEnd, planEnd, layout, {
      fromEndpoint: "actual",
      toEndpoint: "plan",
    });
    expect(metrics.left + metrics.width).toBe(bar.left + bar.width);
    const line = getExecutionLineSpanMetrics("2026-06-01T09:00:00.000Z", actualEnd, layout);
    expect(metrics.left).toBe(line.left + line.width);
  });

  it("snaps open execution line end to today column end", () => {
    const layout = buildTimelineLayout("week", "2026-06-20");
    const today = "2026-06-27";
    const bounds = getDateColumnBounds(today, layout)!;
    const planEnd = "2026-06-23T00:00:00.000Z";
    const clippedToPlan = getExecutionLineSpanMetrics(
      "2026-06-18T00:00:00.000Z",
      planEnd,
      layout,
    );
    const openToToday = getExecutionLineSpanMetrics(
      "2026-06-18T00:00:00.000Z",
      "2026-06-27T12:00:00.000Z",
      layout,
      { endKind: "open", snapEndToToday: today },
    );
    expect(clippedToPlan.left + clippedToPlan.width).toBeLessThan(bounds.left + bounds.width);
    expect(openToToday.left + openToToday.width).toBe(bounds.left + bounds.width);
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
