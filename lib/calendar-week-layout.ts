import { datePartOf } from "@/lib/dates";
import { buildMonthCells, toDateStr } from "@/lib/calendar-month-grid";
import type { CalendarItem } from "@/types";

export type CalendarWeekSegmentKind = "single" | "start" | "middle" | "end";

export interface CalendarWeekSegment {
  item: CalendarItem;
  colStart: number;
  colSpan: number;
  lane: number;
  showTitle: boolean;
  kind: CalendarWeekSegmentKind;
}

export function isMultiDayCalendarItem(item: CalendarItem): boolean {
  const start = datePartOf(item.startDate);
  const end = datePartOf(item.endDate ?? item.startDate);
  if (!start || !end) return false;
  return start < end;
}

export function singleDayItemsOnDate(items: CalendarItem[], dateStr: string): CalendarItem[] {
  return items.filter((item) => {
    const start = datePartOf(item.startDate);
    const end = datePartOf(item.endDate ?? item.startDate);
    if (!start || !end) return false;
    if (start !== end) return false;
    return start === dateStr;
  });
}

export function buildMonthWeekRows(year: number, month: number): (number | null)[][] {
  const cells = buildMonthCells(year, month);
  const padded = [...cells];
  while (padded.length % 7 !== 0) padded.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    rows.push(padded.slice(i, i + 7));
  }
  return rows;
}

export function weekDateStrings(
  year: number,
  month: number,
  week: (number | null)[],
): (string | null)[] {
  return week.map((day) => (day === null ? null : toDateStr(year, month, day)));
}

function weekBounds(weekDates: (string | null)[]): { first: string; last: string } | null {
  const valid = weekDates.filter((d): d is string => d !== null);
  if (valid.length === 0) return null;
  return { first: valid[0]!, last: valid[valid.length - 1]! };
}

function colIndexForDate(weekDates: (string | null)[], dateStr: string): number {
  return weekDates.findIndex((d) => d === dateStr);
}

function segmentKind(
  colSpan: number,
  continuesBefore: boolean,
  continuesAfter: boolean,
): CalendarWeekSegmentKind {
  if (colSpan === 1) return "single";
  if (!continuesBefore && !continuesAfter) return "single";
  if (continuesBefore && continuesAfter) return "middle";
  if (continuesBefore) return "end";
  return "start";
}

function assignLanes(
  spans: Array<{ item: CalendarItem; colStart: number; colEnd: number }>,
): Array<{ item: CalendarItem; colStart: number; colEnd: number; lane: number }> {
  const sorted = [...spans].sort((a, b) => {
    if (a.colStart !== b.colStart) return a.colStart - b.colStart;
    const spanA = a.colEnd - a.colStart;
    const spanB = b.colEnd - b.colStart;
    return spanB - spanA;
  });

  const laneEnds: number[] = [];
  const placed: Array<{ item: CalendarItem; colStart: number; colEnd: number; lane: number }> = [];

  for (const span of sorted) {
    let lane = laneEnds.findIndex((endCol) => endCol < span.colStart);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(span.colEnd);
    } else {
      laneEnds[lane] = span.colEnd;
    }
    placed.push({ ...span, lane });
  }

  return placed;
}

export function buildWeekMultiDaySegments(
  weekDates: (string | null)[],
  items: CalendarItem[],
): CalendarWeekSegment[] {
  const bounds = weekBounds(weekDates);
  if (!bounds) return [];

  const multiDay = items.filter((item) => {
    if (!isMultiDayCalendarItem(item)) return false;
    const start = datePartOf(item.startDate)!;
    const end = datePartOf(item.endDate ?? item.startDate)!;
    return start <= bounds.last && end >= bounds.first;
  });

  const spans = multiDay
    .map((item) => {
      const itemStart = datePartOf(item.startDate)!;
      const itemEnd = datePartOf(item.endDate ?? item.startDate)!;
      const segStart = itemStart > bounds.first ? itemStart : bounds.first;
      const segEnd = itemEnd < bounds.last ? itemEnd : bounds.last;
      const colStart = colIndexForDate(weekDates, segStart);
      const colEnd = colIndexForDate(weekDates, segEnd);
      if (colStart < 0 || colEnd < 0) return null;
      return { item, colStart, colEnd };
    })
    .filter((span): span is { item: CalendarItem; colStart: number; colEnd: number } => span !== null);

  return assignLanes(spans).map((span) => {
    const itemStart = datePartOf(span.item.startDate)!;
    const itemEnd = datePartOf(span.item.endDate ?? span.item.startDate)!;
    const segStartDate = weekDates[span.colStart];
    const segEndDate = weekDates[span.colEnd];
    const continuesBefore = segStartDate ? itemStart < segStartDate : false;
    const continuesAfter = segEndDate ? itemEnd > segEndDate : false;
    const colSpan = span.colEnd - span.colStart + 1;

    return {
      item: span.item,
      colStart: span.colStart,
      colSpan,
      lane: span.lane,
      showTitle: !continuesBefore,
      kind: segmentKind(colSpan, continuesBefore, continuesAfter),
    };
  });
}

export function weekMultiDayLaneCount(segments: CalendarWeekSegment[]): number {
  if (segments.length === 0) return 0;
  return Math.max(...segments.map((s) => s.lane)) + 1;
}
