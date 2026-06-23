import { isoWeekYearAndNumber } from "@/lib/calendar-week-number";
import type { HeaderSpan, TimelineColumn, TimelineLayout } from "@/lib/gantt-scale";
import type { CalendarWeekNumberFormat } from "@/lib/user-preferences";

const WEEKDAY_CN = ["日", "一", "二", "三", "四", "五", "六"] as const;

const ZODIAC_ANIMALS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"] as const;

export function gregorianZodiacYear(year: number): string {
  const idx = ((year - 1900) % 12 + 12) % 12;
  return `${ZODIAC_ANIMALS[idx]}年`;
}

function utcDayOfWeek(date: string): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function startOfWeekMonday(date: string): string {
  const ms = Date.UTC(
    parseInt(date.slice(0, 4), 10),
    parseInt(date.slice(5, 7), 10) - 1,
    parseInt(date.slice(8, 10), 10),
  );
  const dt = new Date(ms);
  const dow = dt.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

function hourPeriodLabel(hour: number): string {
  if (hour < 6) return "凌晨";
  if (hour < 12) return "上午";
  if (hour < 18) return "下午";
  return "夜晚";
}

function hourPeriodKey(col: TimelineColumn): string {
  const hour = parseInt(col.headerBottom, 10);
  return `${col.startDate}-${hourPeriodLabel(hour)}`;
}

function isoYearWeekLabel(weekMonday: string, format: CalendarWeekNumberFormat): string {
  const { week } = isoWeekYearAndNumber(weekMonday);
  return format === "week-label" ? `第${week}周` : String(week);
}

function mergeColumnSpans(
  columns: TimelineColumn[],
  keyFor: (col: TimelineColumn) => string,
  labelFor: (col: TimelineColumn) => string,
): HeaderSpan[] {
  const spans: HeaderSpan[] = [];
  for (const col of columns) {
    const key = keyFor(col);
    const last = spans[spans.length - 1];
    if (last?.key === key) {
      last.width += col.width;
    } else {
      spans.push({ key, label: labelFor(col), width: col.width });
    }
  }
  return spans;
}

function buildDaySubheaderSpans(columns: TimelineColumn[]): HeaderSpan[] {
  return mergeColumnSpans(
    columns,
    hourPeriodKey,
    (col) => hourPeriodLabel(parseInt(col.headerBottom, 10)),
  );
}

function buildWeekSubheaderSpans(columns: TimelineColumn[]): HeaderSpan[] {
  return columns.map((col) => ({
    key: col.key,
    label: WEEKDAY_CN[utcDayOfWeek(col.startDate)]!,
    width: col.width,
  }));
}

function buildMonthSubheaderSpans(
  columns: TimelineColumn[],
  weekFormat: CalendarWeekNumberFormat,
): HeaderSpan[] {
  const labels = new Map<string, string>();
  return mergeColumnSpans(columns, (col) => startOfWeekMonday(col.startDate), (col) => {
    const monday = startOfWeekMonday(col.startDate);
    let label = labels.get(monday);
    if (!label) {
      label = isoYearWeekLabel(monday, weekFormat);
      labels.set(monday, label);
    }
    return label;
  });
}

function buildYearSubheaderSpans(columns: TimelineColumn[]): HeaderSpan[] {
  return mergeColumnSpans(columns, (col) => col.topGroupKey, (col) => col.topGroupLabel);
}

function buildFiveYearSubheaderSpans(columns: TimelineColumn[]): HeaderSpan[] {
  return columns.map((col) => {
    const year = parseInt(col.headerBottom, 10);
    return {
      key: col.key,
      label: gregorianZodiacYear(year),
      width: col.width,
    };
  });
}

export function buildTimelineSubheaderSpans(
  layout: TimelineLayout,
  weekFormat: CalendarWeekNumberFormat = "number",
): HeaderSpan[] {
  const { scale, columns } = layout;
  if (columns.length === 0) return [];

  switch (scale) {
    case "day":
      return buildDaySubheaderSpans(columns);
    case "week":
      return buildWeekSubheaderSpans(columns);
    case "month":
      return buildMonthSubheaderSpans(columns, weekFormat);
    case "year":
      return buildYearSubheaderSpans(columns);
    case "5year":
      return buildFiveYearSubheaderSpans(columns);
    default:
      return [];
  }
}
