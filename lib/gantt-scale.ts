export const GANTT_SCALES = [
  { id: "day", label: "天" },
  { id: "week", label: "周" },
  { id: "month", label: "月度" },
  { id: "year", label: "年度" },
  { id: "5year", label: "5 年" },
] as const;

export type GanttScaleId = (typeof GANTT_SCALES)[number]["id"];

export interface TimelineColumn {
  key: string;
  startDate: string;
  endDate: string;
  width: number;
  topGroupKey: string;
  topGroupLabel: string;
  headerBottom: string;
  isWeekend?: boolean;
  isOtherMonth?: boolean;
}

export interface HeaderSpan {
  key: string;
  label: string;
  width: number;
}

export interface TimelineLayout {
  from: string;
  to: string;
  columns: TimelineColumn[];
  totalWidth: number;
  periodLabel: string;
  topSpans: HeaderSpan[];
}

export interface LayoutBounds {
  from?: string;
  to?: string;
}

export const HOUR_WIDTH = 24;
const DAY_WIDTH = 36;
const WEEK_WIDTH = 88;
const MONTH_DAY_WIDTH = 32;
const YEAR_WEEK_WIDTH = 28;
const FIVEY_MONTH_WIDTH = 22;

const WEEKDAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_NAMES = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

function parseUtcDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDaysUtc(base: string, days: number) {
  const dt = new Date(parseUtcDate(base));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round((parseUtcDate(to) - parseUtcDate(from)) / 86400000);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeekMonday(date: string) {
  const dt = new Date(parseUtcDate(date));
  const dow = dt.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

function startOfWeekSunday(date: string) {
  const dt = new Date(parseUtcDate(date));
  const dow = dt.getUTCDay();
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}

function startOfMonth(date: string) {
  const [y, m] = date.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

function endOfMonth(date: string) {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

function addMonthsUtc(base: string, months: number) {
  const [y, m, d] = base.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, d)).toISOString().slice(0, 10);
}

function utcDayOfWeek(date: string) {
  return new Date(parseUtcDate(date)).getUTCDay();
}

function isWeekendDate(date: string) {
  const dow = utcDayOfWeek(date);
  return dow === 0 || dow === 6;
}

function formatPeriodLabel(scale: GanttScaleId, anchor: string): string {
  const [y, m, d] = anchor.split("-").map(Number);
  if (scale === "day") return `${y}年${m}月${d}日`;
  if (scale === "week" || scale === "month") return `${y}年${m}月`;
  if (scale === "year") return `${y}年`;
  if (scale === "5year") return `${y - 2}年 – ${y + 2}年`;
  return `${y}年${m}月`;
}

function mergeBounds(
  scaleFrom: string,
  scaleTo: string,
  dataBounds?: LayoutBounds | null,
): { from: string; to: string } {
  if (!dataBounds?.from && !dataBounds?.to) return { from: scaleFrom, to: scaleTo };
  let from = scaleFrom;
  let to = scaleTo;
  if (dataBounds.from && dataBounds.from < from) from = dataBounds.from;
  if (dataBounds.to && dataBounds.to > to) to = dataBounds.to;
  return { from, to };
}

function buildTopSpans(columns: TimelineColumn[]): HeaderSpan[] {
  const spans: HeaderSpan[] = [];
  for (const col of columns) {
    const last = spans[spans.length - 1];
    if (last?.key === col.topGroupKey) {
      last.width += col.width;
    } else {
      spans.push({
        key: col.topGroupKey,
        label: col.topGroupLabel,
        width: col.width,
      });
    }
  }
  return spans;
}

function finalizeLayout(
  scale: GanttScaleId,
  anchor: string,
  columns: TimelineColumn[],
): TimelineLayout {
  return {
    from: columns[0]!.startDate,
    to: columns[columns.length - 1]!.endDate,
    columns,
    totalWidth: columns.reduce((s, c) => s + c.width, 0),
    periodLabel: formatPeriodLabel(scale, anchor),
    topSpans: buildTopSpans(columns),
  };
}

function buildDayColumns(from: string, to: string): TimelineColumn[] {
  const columns: TimelineColumn[] = [];
  let day = from;
  while (day <= to) {
    const [y, m, d] = day.split("-").map(Number);
    const dayLabel = `${m}月${d}日`;
    for (let h = 0; h < 24; h++) {
      columns.push({
        key: `${day}-${h}`,
        startDate: day,
        endDate: day,
        width: HOUR_WIDTH,
        topGroupKey: day,
        topGroupLabel: dayLabel,
        headerBottom: `${h}`,
      });
    }
    day = addDaysUtc(day, 1);
  }
  return columns;
}

function buildWeekDayColumns(from: string, to: string): TimelineColumn[] {
  const columns: TimelineColumn[] = [];
  let day = from;
  while (day <= to) {
    const dow = utcDayOfWeek(day);
    const dayNum = parseInt(day.slice(8, 10), 10);
    const [y, m] = day.split("-").map(Number);
    columns.push({
      key: day,
      startDate: day,
      endDate: day,
      width: DAY_WIDTH,
      topGroupKey: `${y}-${m}`,
      topGroupLabel: `${y}年${m}月`,
      headerBottom: `${WEEKDAY_SHORT[dow]} ${dayNum}`,
      isWeekend: isWeekendDate(day),
    });
    day = addDaysUtc(day, 1);
  }
  return columns;
}

function buildMonthDayColumns(from: string, to: string): TimelineColumn[] {
  const columns: TimelineColumn[] = [];
  let day = from;
  while (day <= to) {
    const dayNum = parseInt(day.slice(8, 10), 10);
    const [y, m] = day.split("-").map(Number);
    const monthStart = startOfMonth(day);
    columns.push({
      key: day,
      startDate: day,
      endDate: day,
      width: MONTH_DAY_WIDTH,
      topGroupKey: monthStart,
      topGroupLabel: `${y}年${m}月`,
      headerBottom: `${dayNum}`,
      isWeekend: isWeekendDate(day),
    });
    day = addDaysUtc(day, 1);
  }
  return columns;
}

function buildYearWeekColumns(from: string, to: string): TimelineColumn[] {
  const columns: TimelineColumn[] = [];
  let weekStart = startOfWeekMonday(from);
  while (weekStart <= to) {
    const weekEnd = addDaysUtc(weekStart, 6);
    if (weekEnd >= from) {
      const [y, m] = weekStart.split("-").map(Number);
      const monthStart = startOfMonth(weekStart);
      const dayNum = parseInt(weekStart.slice(8, 10), 10);
      columns.push({
        key: weekStart,
        startDate: weekStart,
        endDate: weekEnd,
        width: YEAR_WEEK_WIDTH,
        topGroupKey: monthStart,
        topGroupLabel: MONTH_NAMES[m - 1]!,
        headerBottom: `${dayNum}`,
      });
    }
    weekStart = addDaysUtc(weekStart, 7);
  }
  return columns;
}

function buildFiveYearMonthColumns(fromYear: number, toYear: number): TimelineColumn[] {
  const columns: TimelineColumn[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const start = `${y}-${String(m).padStart(2, "0")}-01`;
      const end = endOfMonth(start);
      columns.push({
        key: start,
        startDate: start,
        endDate: end,
        width: FIVEY_MONTH_WIDTH,
        topGroupKey: `${y}`,
        topGroupLabel: `${y}年`,
        headerBottom: `${m}`,
      });
    }
  }
  return columns;
}

function scaleDefaultRange(scale: GanttScaleId, anchor: string): { from: string; to: string } {
  switch (scale) {
    case "day": {
      const from = addDaysUtc(anchor, -2);
      const to = addDaysUtc(anchor, 4);
      return { from, to };
    }
    case "week": {
      const monday = startOfWeekMonday(anchor);
      const from = addDaysUtc(monday, -14);
      const to = addDaysUtc(monday, 27);
      return { from, to };
    }
    case "month": {
      const mid = startOfMonth(anchor);
      const fromMonth = addMonthsUtc(mid, -1);
      const toMonth = addMonthsUtc(mid, 2);
      const from = startOfWeekSunday(startOfMonth(fromMonth));
      const to = addDaysUtc(startOfWeekSunday(endOfMonth(toMonth)), 6);
      return { from, to };
    }
    case "year": {
      const y = parseInt(anchor.slice(0, 4), 10);
      const from = startOfWeekMonday(`${y}-01-01`);
      const to = endOfMonth(`${y}-12-31`);
      return { from, to };
    }
    case "5year": {
      const y = parseInt(anchor.slice(0, 4), 10);
      return {
        from: `${y - 2}-01-01`,
        to: `${y + 2}-12-31`,
      };
    }
  }
}

function generateColumns(
  scale: GanttScaleId,
  from: string,
  to: string,
  anchor: string,
): TimelineColumn[] {
  switch (scale) {
    case "day":
      return buildDayColumns(from, to);
    case "week":
      return buildWeekDayColumns(from, to);
    case "month": {
      const gridFrom = startOfWeekSunday(from);
      const gridTo = addDaysUtc(startOfWeekSunday(to), 6);
      const cols = buildMonthDayColumns(gridFrom, gridTo);
      const focusMonth = startOfMonth(anchor);
      for (const col of cols) {
        col.isOtherMonth = startOfMonth(col.startDate) !== focusMonth;
      }
      return cols;
    }
    case "year":
      return buildYearWeekColumns(from, to);
    case "5year": {
      const y = parseInt(anchor.slice(0, 4), 10);
      let fromYear = y - 2;
      let toYear = y + 2;
      const fromY = parseInt(from.slice(0, 4), 10);
      const toY = parseInt(to.slice(0, 4), 10);
      if (fromY < fromYear) fromYear = fromY;
      if (toY > toYear) toYear = toY;
      return buildFiveYearMonthColumns(fromYear, toYear);
    }
  }
}

export function buildTimelineLayout(
  scale: GanttScaleId,
  anchor: string,
  dataBounds?: LayoutBounds | null,
): TimelineLayout {
  const defaultRange = scaleDefaultRange(scale, anchor);
  const { from, to } = mergeBounds(defaultRange.from, defaultRange.to, dataBounds);
  const columns = generateColumns(scale, from, to, anchor);
  return finalizeLayout(scale, anchor, columns);
}

export function shiftAnchor(scale: GanttScaleId, anchor: string, direction: -1 | 1): string {
  switch (scale) {
    case "day":
      return addDaysUtc(anchor, direction);
    case "week":
    case "month":
      return addDaysUtc(anchor, direction);
    case "year":
    case "5year":
      return addMonthsUtc(anchor, direction);
    default:
      return anchor;
  }
}

export function dateToX(date: string, layout: TimelineLayout): number {
  const fromMs = parseUtcDate(layout.from);
  const toMs = parseUtcDate(layout.to) + 86400000;
  const dMs = parseUtcDate(date);
  const span = toMs - fromMs;
  if (span <= 0) return 0;
  return ((dMs - fromMs) / span) * layout.totalWidth;
}

export function barMetricsFromDates(
  startDate: string,
  endDate: string,
  layout: TimelineLayout,
): { left: number; width: number } {
  const left = dateToX(startDate, layout);
  const endX = dateToX(endDate, layout);
  const minWidth = layout.totalWidth / Math.max(layout.columns.length, 1);
  return {
    left: Math.max(0, left),
    width: Math.max(minWidth * 0.5, endX - left + minWidth * 0.8),
  };
}

export function pixelDeltaToDays(deltaX: number, layout: TimelineLayout): number {
  const totalDays = daysBetween(layout.from, layout.to) + 1;
  const dayWidth = layout.totalWidth / totalDays;
  return Math.round(deltaX / dayWidth);
}

export function compactTimelineRange() {
  const today = todayStr();
  return { from: addDaysUtc(today, -30), to: addDaysUtc(today, 45) };
}

export function buildCompactLayout(from: string, to: string): TimelineLayout {
  const columns = buildWeekDayColumns(from, to);
  return finalizeLayout("week", todayStr(), columns);
}

export function isTodayInColumn(today: string, col: TimelineColumn) {
  return today >= col.startDate && today <= col.endDate;
}
