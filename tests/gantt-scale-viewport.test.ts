import { describe, expect, it } from "vitest";
import { buildTimelineLayout, scaleTimelineToViewport } from "@/lib/gantt-scale";

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
