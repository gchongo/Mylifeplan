import { todayStr as localTodayStr } from "@/lib/dates";

export const GANTT_SCALES = [
  { id: "day", label: "天" },
  { id: "week", label: "周" },
  { id: "month", label: "月" },
  { id: "year", label: "年" },
  { id: "5year", label: "5年" },
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
  scale: GanttScaleId;
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

export const HOUR_WIDTH = 56;
const DAY_WIDTH = 36;
const WEEK_WIDTH = 88;
const MONTH_DAY_WIDTH = 32;
const YEAR_WEEK_WIDTH = 28;
const FIVEY_YEAR_WIDTH = 88;

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
  return localTodayStr();
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

function addYearsUtc(base: string, years: number) {
  const [y, m, d] = base.split("-").map(Number);
  return new Date(Date.UTC(y + years, m - 1, d)).toISOString().slice(0, 10);
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
  if (scale === "5year") {
    const start = y - 2;
    const end = y + 2;
    return `${start}–${end}年`;
  }
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
    scale,
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

function buildFiveYearYearColumns(fromYear: number, toYear: number): TimelineColumn[] {
  const columns: TimelineColumn[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    columns.push({
      key: `${y}`,
      startDate: `${y}-01-01`,
      endDate: `${y}-12-31`,
      width: FIVEY_YEAR_WIDTH,
      topGroupKey: "years",
      topGroupLabel: "",
      headerBottom: `${y}`,
    });
  }
  return columns;
}

function datePartAndLocalTime(date: string): { dateStr: string; hour: number; minute: number } {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { dateStr: date, hour: 0, minute: 0 };
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return { dateStr: date.slice(0, 10), hour: 0, minute: 0 };
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { dateStr, hour: d.getHours(), minute: d.getMinutes() };
}

export function planDateOnly(date: string): string {
  return datePartAndLocalTime(date).dateStr;
}

/** 仅日期或 UTC 零点：甘特条尾按当日 23:59 对齐；含具体时刻则保留 */
export function isDateOnlyPlanInstant(value: string): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  if (!value.includes("T")) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

/** 甘特图上的时刻 X：仅日期对齐到当日结束（23:59 / 列右缘） */
export function ganttInstantToX(date: string, layout: TimelineLayout): number {
  if (isDateOnlyPlanInstant(date)) {
    if (layout.scale === "day") {
      return dateToX(`${planDateOnly(date)}T23:59:59`, layout);
    }
    const bounds = getDateColumnBounds(date, layout);
    if (bounds) return bounds.left + bounds.width;
  }
  return dateToX(date, layout);
}

/** 提前/超期色条：起止均按 day-end 规则对齐，开放终点可 snap 到今天列 */
export function getExecutionFillSpanMetrics(
  from: string,
  to: string,
  layout: TimelineLayout,
  options: { snapEndToToday?: string } = {},
): { left: number; width: number } {
  const left = ganttInstantToX(from, layout);
  let right: number;
  if (options.snapEndToToday) {
    const bounds = getDateColumnBounds(options.snapEndToToday, layout);
    right = bounds ? bounds.left + bounds.width : ganttInstantToX(to, layout);
  } else {
    right = ganttInstantToX(to, layout);
  }
  const spanLeft = Math.min(left, right);
  return {
    left: Math.max(0, spanLeft),
    width: Math.max(2, Math.abs(right - left)),
  };
}

/** 日期所在列在时间轴上的 left / width（天视图含当天全部小时列） */
export function getDateColumnBounds(
  date: string,
  layout: TimelineLayout,
): { left: number; width: number } | null {
  const dateStr = planDateOnly(date);
  let offset = 0;
  let matchLeft: number | null = null;
  let matchWidth = 0;

  for (const col of layout.columns) {
    const contains = dateStr >= col.startDate && dateStr <= col.endDate;
    if (contains) {
      if (matchLeft == null) matchLeft = offset;
      matchWidth += col.width;
    } else if (matchLeft != null) {
      break;
    }
    offset += col.width;
  }

  if (matchLeft == null) return null;
  return { left: matchLeft, width: matchWidth };
}

export function dateToX(date: string, layout: TimelineLayout): number {
  if (layout.scale === "day" && layout.columns.length > 0) {
    const { dateStr, hour, minute } = datePartAndLocalTime(date);
    let x = 0;
    for (const col of layout.columns) {
      const dash = col.key.lastIndexOf("-");
      const colDay = col.key.slice(0, dash);
      const colHour = parseInt(col.key.slice(dash + 1), 10);
      if (colDay < dateStr || (colDay === dateStr && colHour < hour)) {
        x += col.width;
        continue;
      }
      if (colDay === dateStr && colHour === hour) {
        return x + (minute / 60) * col.width;
      }
      return x;
    }
    return x;
  }

  const dateStr = datePartAndLocalTime(date).dateStr;
  const fromMs = parseUtcDate(layout.from);
  const toMs = parseUtcDate(layout.to) + 86400000;
  const dMs = parseUtcDate(dateStr);
  const span = toMs - fromMs;
  if (span <= 0) return 0;
  return ((dMs - fromMs) / span) * layout.totalWidth;
}

export function getTimelineSpanMetrics(
  startDate: string,
  endDate: string,
  layout: TimelineLayout,
  options: { snapEndToDate?: string; barPadding?: boolean } = {},
): { left: number; width: number } {
  const { snapEndToDate, barPadding = false } = options;
  const left = dateToX(startDate, layout);
  const minUnit =
    layout.scale === "day"
      ? HOUR_WIDTH * 0.25
      : layout.totalWidth / Math.max(layout.columns.length, 1);

  let endX: number;
  if (snapEndToDate) {
    const bounds = getDateColumnBounds(snapEndToDate, layout);
    endX = bounds ? bounds.left + bounds.width : dateToX(endDate, layout);
  } else {
    endX = dateToX(endDate, layout);
    if (barPadding && layout.scale !== "day") {
      endX += minUnit * 0.8;
    }
  }

  return {
    left: Math.max(0, left),
    width: Math.max(barPadding ? minUnit * 0.5 : 2, endX - left),
  };
}

export function barMetricsFromDates(
  startDate: string,
  endDate: string,
  layout: TimelineLayout,
): { left: number; width: number } {
  return getTimelineSpanMetrics(startDate, endDate, layout, { barPadding: true });
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
      // 多 2 年作左右缓冲，便于拖拽平移
      return { from: `${y - 3}-01-01`, to: `${y + 3}-12-31` };
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
      const fromYear = parseInt(from.slice(0, 4), 10);
      const toYear = parseInt(to.slice(0, 4), 10);
      return buildFiveYearYearColumns(fromYear, toYear);
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

/** 5 年尺度：列宽填满视口，并保留约 10% 可滚动余量以便拖拽 */
export function scaleTimelineToViewport(
  layout: TimelineLayout,
  viewportWidth: number,
  minColumnWidth = 120,
): TimelineLayout {
  if (layout.scale !== "5year" || viewportWidth <= 0 || layout.columns.length === 0) {
    return layout;
  }

  const minTotal = layout.columns.length * minColumnWidth;
  const fillWidth = Math.max(viewportWidth, minTotal);
  const targetWidth = Math.ceil(fillWidth * 1.1);
  if (Math.abs(targetWidth - layout.totalWidth) < 2) return layout;

  const factor = targetWidth / layout.totalWidth;
  const columns = layout.columns.map((col) => ({
    ...col,
    width: col.width * factor,
  }));

  return {
    ...layout,
    columns,
    totalWidth: targetWidth,
    topSpans: buildTopSpans(columns),
  };
}

export function shiftAnchor(scale: GanttScaleId, anchor: string, direction: -1 | 1): string {
  switch (scale) {
    case "day":
      return addDaysUtc(anchor, direction);
    case "week":
    case "month":
      return addDaysUtc(anchor, direction);
    case "year":
      return addMonthsUtc(anchor, direction);
    case "5year":
      return addYearsUtc(anchor, direction * 5);
    default:
      return anchor;
  }
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
