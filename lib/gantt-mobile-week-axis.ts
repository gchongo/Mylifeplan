import { isoWeekYearAndNumber } from "@/lib/calendar-week-number";
import type { TimelineColumn } from "@/lib/gantt-scale";

export type MobileWeekSpan = {
  key: string;
  label: string;
  height: number;
};

/** 竖排「第N周」列宽：单字宽度 + 极小左右留白 */
export const MOBILE_WEEK_AXIS_WIDTH = 14;

export function mobileWeekAxisWidthPx(): number {
  return MOBILE_WEEK_AXIS_WIDTH;
}

function startOfWeekMonday(date: string): string {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

/** 按 ISO 周合并日列，供移动端甘特左侧「周」列 */
export function buildMobileWeekSpans(columns: TimelineColumn[]): MobileWeekSpan[] {
  if (columns.length === 0) return [];

  const spans: MobileWeekSpan[] = [];
  for (const col of columns) {
    const weekMonday = startOfWeekMonday(col.startDate);
    const { week } = isoWeekYearAndNumber(weekMonday);
    const last = spans[spans.length - 1];
    if (last?.key === weekMonday) {
      last.height += col.width;
    } else {
      spans.push({ key: weekMonday, label: `第${week}周`, height: col.width });
    }
  }
  return spans;
}
