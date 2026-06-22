import { describe, expect, it } from "vitest";
import { buildTimelineLayout } from "@/lib/gantt-scale";
import {
  constrainPlanMoveByMs,
  pixelDeltaToDragAmount,
  planSpanMs,
  shiftPlanByDragAmount,
  shiftPlanDateTime,
  timelineDragUnit,
} from "@/lib/gantt-plan-drag";

describe("gantt plan drag", () => {
  it("snaps to 30 minutes on day scale", () => {
    const layout = buildTimelineLayout("day", "2026-06-30");
    expect(timelineDragUnit(layout)).toBe("30min");
    expect(pixelDeltaToDragAmount(28, layout)).toBe(1);
    expect(shiftPlanByDragAmount("2026-06-30T10:00:00.000Z", 1, layout)).toBe(
      "2026-06-30T10:30:00.000Z",
    );
    expect(shiftPlanByDragAmount("2026-06-30T10:00:00.000Z", 2, layout)).toBe(
      "2026-06-30T11:00:00.000Z",
    );
  });

  it("snaps to days on week scale", () => {
    const layout = buildTimelineLayout("week", "2026-06-30");
    expect(timelineDragUnit(layout)).toBe("day");
    expect(pixelDeltaToDragAmount(36, layout)).toBe(1);
    expect(shiftPlanByDragAmount("2026-06-30", 1, layout).slice(0, 10)).toBe("2026-07-01");
  });

  it("snaps to weeks on year scale", () => {
    const layout = buildTimelineLayout("year", "2026-06-30");
    expect(timelineDragUnit(layout)).toBe("week");
    expect(pixelDeltaToDragAmount(28, layout)).toBe(1);
    const shifted = shiftPlanByDragAmount("2026-06-30", 1, layout);
    expect(shifted.slice(0, 10)).toBe("2026-07-07");
  });

  it("snaps to years on 5year scale", () => {
    const layout = buildTimelineLayout("5year", "2026-06-30");
    expect(timelineDragUnit(layout)).toBe("year");
    expect(pixelDeltaToDragAmount(88, layout)).toBe(1);
    expect(shiftPlanByDragAmount("2026-06-30", 1, layout).slice(0, 4)).toBe("2027");
  });

  it("preserves duration when moving by ms", () => {
    expect(planSpanMs("2026-06-30T10:00:00.000Z", "2026-06-30T11:15:00.000Z")).toBe(75 * 60 * 1000);
    const moved = constrainPlanMoveByMs(
      "2026-06-30T10:30:00.000Z",
      45 * 60 * 1000,
      {},
    );
    expect(moved).toEqual({
      start: "2026-06-30T10:30:00.000Z",
      end: "2026-06-30T11:15:00.000Z",
    });
    expect(shiftPlanDateTime("2026-06-30T10:00:00.000Z", 30 * 60 * 1000)).toBe(
      "2026-06-30T10:30:00.000Z",
    );
  });
});
