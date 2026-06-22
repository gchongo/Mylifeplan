import { formatPlanDateTime, parsePlanDateTime } from "@/lib/dates";
import { HOUR_WIDTH, pixelDeltaToDays, type TimelineLayout } from "@/lib/gantt-scale";
import type { PlanDragConstraints } from "@/lib/gantt-plan-bind";

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export function timelineUsesMinutePrecision(layout: TimelineLayout): boolean {
  return layout.scale === "day";
}

export function pixelDeltaToTimelineMs(deltaX: number, layout: TimelineLayout): number {
  if (timelineUsesMinutePrecision(layout)) {
    const pxPerMinute = HOUR_WIDTH / 60;
    return Math.round(deltaX / pxPerMinute) * MINUTE_MS;
  }
  return pixelDeltaToDays(deltaX, layout) * DAY_MS;
}

export function shiftPlanDateTime(date: string, deltaMs: number): string {
  const parsed = parsePlanDateTime(date);
  if (!parsed) return date;
  return formatPlanDateTime(new Date(parsed.getTime() + deltaMs))!;
}

export function planSpanMs(start: string, end: string): number {
  const startMs = parsePlanDateTime(start)?.getTime();
  const endMs = parsePlanDateTime(end)?.getTime();
  if (startMs == null || endMs == null) return 0;
  return Math.max(0, endMs - startMs);
}

export function constrainPlanMoveByMs(
  newStart: string,
  durationMs: number,
  constraints: PlanDragConstraints,
): { start: string; end: string } {
  let start = newStart;
  if (constraints.minStartDate && start < constraints.minStartDate) {
    start = constraints.minStartDate;
  }
  let end = shiftPlanDateTime(start, durationMs);

  if (constraints.maxContributionDate && end < constraints.maxContributionDate) {
    end = constraints.maxContributionDate;
    start = shiftPlanDateTime(end, -durationMs);
    if (constraints.minStartDate && start < constraints.minStartDate) {
      start = constraints.minStartDate;
      end = shiftPlanDateTime(start, durationMs);
    }
  }
  if (constraints.minContributionDate && start > constraints.minContributionDate) {
    start = constraints.minContributionDate;
    end = shiftPlanDateTime(start, durationMs);
  }
  if (parsePlanDateTime(end)!.getTime() < parsePlanDateTime(start)!.getTime()) {
    end = start;
  }
  return { start, end };
}
