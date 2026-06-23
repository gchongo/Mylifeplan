import { daysInMonth, mondayOffset, toDateStr } from "@/lib/calendar-month-grid";
import type { CalendarWeekNumberPreferences } from "@/lib/user-preferences";

export function buildMonthWeekRows(year: number, month: number): (number | null)[][] {
  const leading = mondayOffset(year, month);
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

/** 该行用于计算周数的锚定日期（优先取当月内的第一天） */
export function weekRowAnchorDate(
  year: number,
  month: number,
  week: (number | null)[],
  weekIndex: number,
  weekCount: number,
): string {
  const firstInMonth = week.find((d) => d !== null);
  if (firstInMonth != null) return toDateStr(year, month, firstInMonth);
  if (weekIndex === 0) return toDateStr(year, month, 1);
  return toDateStr(year, month, daysInMonth(year, month));
}

/** ISO 8601 周年与周序（周一为一周起始） */
export function isoWeekYearAndNumber(dateStr: string): { weekYear: number; week: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const weekYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { weekYear, week };
}

export function formatCalendarWeekNumber(
  prefs: CalendarWeekNumberPreferences,
  year: number,
  month: number,
  week: (number | null)[],
  weekIndex: number,
  weekCount: number,
): string {
  const anchor = weekRowAnchorDate(year, month, week, weekIndex, weekCount);
  let n: number;
  if (prefs.mode === "month-ordinal") {
    n = weekIndex + 1;
  } else {
    n = isoWeekYearAndNumber(anchor).week;
  }

  if (prefs.format === "week-label") {
    return `第${n}周`;
  }
  return String(n);
}
