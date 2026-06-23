import { formatPlanDateTime, parsePlanDateTime } from "@/lib/dates";
import {
  FIVEY_YEAR_WIDTH,
  HOUR_WIDTH,
  YEAR_WEEK_WIDTH,
  pixelDeltaToDays,
  type TimelineLayout,
} from "@/lib/gantt-scale";
import type { PlanDragConstraints } from "@/lib/gantt-plan-bind";

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
const THIRTY_MIN_MS = 30 * MINUTE_MS;

export type PlanDragMode = "move" | "resize-start" | "resize-end";

export type TimelineDragUnit = "30min" | "day" | "week" | "year";

export function timelineDragUnit(layout: TimelineLayout): TimelineDragUnit {
  switch (layout.scale) {
    case "day":
      return "30min";
    case "week":
    case "month":
      return "day";
    case "year":
      return "week";
    case "5year":
      return "year";
  }
}

/** 将像素位移转为当前刻度下的拖动步数（已取整） */
export function pixelDeltaToDragAmount(deltaX: number, layout: TimelineLayout): number {
  switch (timelineDragUnit(layout)) {
    case "30min": {
      const pxPer30Min = HOUR_WIDTH / 2;
      return Math.round(deltaX / pxPer30Min);
    }
    case "day":
      return pixelDeltaToDays(deltaX, layout);
    case "week": {
      const weekWidth = layout.columns[0]?.width ?? YEAR_WEEK_WIDTH;
      return Math.round(deltaX / weekWidth);
    }
    case "year": {
      const yearWidth = layout.columns[0]?.width ?? FIVEY_YEAR_WIDTH;
      return Math.round(deltaX / yearWidth);
    }
  }
}

export function shiftPlanDateTime(date: string, deltaMs: number): string {
  const parsed = parsePlanDateTime(date);
  if (!parsed) return date;
  return formatDragShiftedDate(date, formatPlanDateTime(new Date(parsed.getTime() + deltaMs))!);
}

function formatDragShiftedDate(original: string, shifted: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(original)) {
    return shifted.slice(0, 10);
  }
  return shifted;
}

/** 按当前视图刻度步进平移计划时间 */
export function shiftPlanByDragAmount(
  date: string,
  amount: number,
  layout: TimelineLayout,
): string {
  if (amount === 0) return date;

  let shifted: string;
  switch (timelineDragUnit(layout)) {
    case "30min":
      shifted = shiftPlanDateTime(date, amount * THIRTY_MIN_MS);
      break;
    case "day":
      shifted = shiftPlanDateTime(date, amount * DAY_MS);
      break;
    case "week":
      shifted = shiftPlanDateTime(date, amount * 7 * DAY_MS);
      break;
    case "year": {
      const parsed = parsePlanDateTime(date);
      if (!parsed) return date;
      const next = new Date(parsed);
      next.setUTCFullYear(next.getUTCFullYear() + amount);
      shifted = formatDragShiftedDate(date, formatPlanDateTime(next)!);
      break;
    }
  }
  return shifted;
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
  const startMs = parsePlanDateTime(start)?.getTime();
  const endMs = parsePlanDateTime(end)?.getTime();
  if (startMs != null && endMs != null && endMs < startMs) {
    end = start;
  }
  return { start, end };
}
