import { describe, expect, it } from "vitest";
import {
  buildTimelineLayout,
  getDateColumnBounds,
  getTimelineSpanMetrics,
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
