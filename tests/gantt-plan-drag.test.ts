import { describe, expect, it } from "vitest";
import { buildTimelineLayout } from "@/lib/gantt-scale";
import {
  constrainPlanMoveByMs,
  pixelDeltaToTimelineMs,
  planSpanMs,
  shiftPlanDateTime,
  timelineUsesMinutePrecision,
} from "@/lib/gantt-plan-drag";

describe("gantt plan drag", () => {
  it("uses minute precision on day scale", () => {
    const layout = buildTimelineLayout("day", "2026-06-30");
    expect(timelineUsesMinutePrecision(layout)).toBe(true);
    expect(pixelDeltaToTimelineMs(56, layout)).toBe(60 * 60 * 1000);
    expect(pixelDeltaToTimelineMs(56 / 2, layout)).toBe(30 * 60 * 1000);
  });

  it("shifts plan datetimes by milliseconds", () => {
    const start = "2026-06-30T10:00:00.000Z";
    const shifted = shiftPlanDateTime(start, 30 * 60 * 1000);
    expect(shifted).toBe("2026-06-30T10:30:00.000Z");
    expect(planSpanMs("2026-06-30T10:00:00.000Z", "2026-06-30T11:15:00.000Z")).toBe(75 * 60 * 1000);
  });

  it("moves plan by minute duration", () => {
    const moved = constrainPlanMoveByMs(
      "2026-06-30T10:30:00.000Z",
      45 * 60 * 1000,
      {},
    );
    expect(moved).toEqual({
      start: "2026-06-30T10:30:00.000Z",
      end: "2026-06-30T11:15:00.000Z",
    });
  });
});
