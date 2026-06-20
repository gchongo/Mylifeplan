export const GANTT_SCALES = [
  { id: "hour", label: "小时" },
  { id: "day", label: "天" },
  { id: "week", label: "周" },
  { id: "biweek", label: "双周" },
  { id: "month", label: "月度" },
  { id: "quarter", label: "季度" },
  { id: "year", label: "年度" },
  { id: "5year", label: "5 年" },
] as const;

export type GanttScaleId = (typeof GANTT_SCALES)[number]["id"];

export interface TimelineColumn {
  key: string;
  startDate: string;
  endDate: string;
  width: number;
  headerTop: string;
  headerBottom: string;
}

export interface TimelineLayout {
  from: string;
  to: string;
  columns: TimelineColumn[];
  totalWidth: number;
}

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

function startOfWeek(date: string) {
  const dt = new Date(parseUtcDate(date));
  const dow = dt.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

function startOfMonth(date: string) {
  const [y, m] = date.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

function endOfMonth(date: string) {
  const [y, m] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m, 0));
  return dt.toISOString().slice(0, 10);
}

function addMonthsUtc(base: string, months: number) {
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return dt.toISOString().slice(0, 10);
}

function quarterStart(date: string) {
  const [y, m] = date.split("-").map(Number);
  const qMonth = Math.floor((m - 1) / 3) * 3 + 1;
  return `${y}-${String(qMonth).padStart(2, "0")}-01`;
}

function quarterEnd(date: string) {
  const [y, m] = date.split("-").map(Number);
  const qMonth = Math.floor((m - 1) / 3) * 3 + 3;
  return endOfMonth(`${y}-${String(qMonth).padStart(2, "0")}-01`);
}

function yearStart(date: string) {
  return `${date.slice(0, 4)}-01-01`;
}

function yearEnd(date: string) {
  return `${date.slice(0, 4)}-12-31`;
}

function fiveYearBlockStart(date: string) {
  const y = parseInt(date.slice(0, 4), 10);
  const block = Math.floor(y / 5) * 5;
  return `${block}-01-01`;
}

function fiveYearBlockEnd(date: string) {
  const y = parseInt(date.slice(0, 4), 10);
  const block = Math.floor(y / 5) * 5 + 4;
  return `${block}-12-31`;
}

function formatMonthLabel(date: string) {
  const [y, m] = date.split("-").map(Number);
  return `${y}年${m}月`;
}

function formatDayLabel(date: string) {
  const dt = new Date(parseUtcDate(date));
  return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
}

function formatWeekLabel(start: string) {
  const end = addDaysUtc(start, 6);
  return `${formatDayLabel(start)}-${formatDayLabel(end)}`;
}

const HOUR_WIDTH = 20;
const DAY_WIDTH = 32;
const WEEK_WIDTH = 72;
const BIWEEK_WIDTH = 88;
const MONTH_WIDTH = 96;
const QUARTER_WIDTH = 112;
const YEAR_WIDTH = 128;
const FIVE_YEAR_WIDTH = 160;

export function buildTimelineLayout(
  scale: GanttScaleId,
  anchor: string,
  timelineAreaWidth: number,
): TimelineLayout {
  const width = Math.max(timelineAreaWidth, 320);

  if (scale === "hour") {
    const hoursVisible = Math.max(24, Math.floor(width / HOUR_WIDTH));
    const daysVisible = Math.ceil(hoursVisible / 24);
    const from = addDaysUtc(anchor, -Math.floor(daysVisible / 2));
    const to = addDaysUtc(from, daysVisible - 1);
    const columns: TimelineColumn[] = [];
    for (let d = 0; d < daysVisible; d++) {
      const day = addDaysUtc(from, d);
      for (let h = 0; h < 24; h++) {
        columns.push({
          key: `${day}-${h}`,
          startDate: day,
          endDate: day,
          width: HOUR_WIDTH,
          headerTop: formatDayLabel(day),
          headerBottom: `${h}`,
        });
      }
    }
    return { from, to, columns, totalWidth: columns.length * HOUR_WIDTH };
  }

  if (scale === "day") {
    const count = Math.max(14, Math.ceil(width / DAY_WIDTH));
    const past = Math.floor(count * 0.4);
    const from = addDaysUtc(anchor, -past);
    const to = addDaysUtc(from, count - 1);
    const columns: TimelineColumn[] = [];
    for (let i = 0; i < count; i++) {
      const day = addDaysUtc(from, i);
      columns.push({
        key: day,
        startDate: day,
        endDate: day,
        width: DAY_WIDTH,
        headerTop: formatMonthLabel(day),
        headerBottom: day.slice(8, 10),
      });
    }
    return { from, to, columns, totalWidth: count * DAY_WIDTH };
  }

  if (scale === "week") {
    const count = Math.max(6, Math.floor(width / WEEK_WIDTH));
    const weekStart = startOfWeek(anchor);
    const from = addDaysUtc(weekStart, -Math.floor(count / 2) * 7);
    const columns: TimelineColumn[] = [];
    for (let i = 0; i < count; i++) {
      const start = addDaysUtc(from, i * 7);
      const end = addDaysUtc(start, 6);
      columns.push({
        key: start,
        startDate: start,
        endDate: end,
        width: WEEK_WIDTH,
        headerTop: formatMonthLabel(start),
        headerBottom: formatWeekLabel(start),
      });
    }
    const to = columns[columns.length - 1]!.endDate;
    return { from, to, columns, totalWidth: count * WEEK_WIDTH };
  }

  if (scale === "biweek") {
    const count = Math.max(4, Math.floor(width / BIWEEK_WIDTH));
    const weekStart = startOfWeek(anchor);
    const from = addDaysUtc(weekStart, -Math.floor(count / 2) * 14);
    const columns: TimelineColumn[] = [];
    for (let i = 0; i < count; i++) {
      const start = addDaysUtc(from, i * 14);
      const end = addDaysUtc(start, 13);
      columns.push({
        key: start,
        startDate: start,
        endDate: end,
        width: BIWEEK_WIDTH,
        headerTop: formatMonthLabel(start),
        headerBottom: formatWeekLabel(start),
      });
    }
    const to = columns[columns.length - 1]!.endDate;
    return { from, to, columns, totalWidth: count * BIWEEK_WIDTH };
  }

  if (scale === "month") {
    const count = Math.max(6, Math.floor(width / MONTH_WIDTH));
    const mid = startOfMonth(anchor);
    const fromMonth = addMonthsUtc(mid, -Math.floor(count / 2));
    const columns: TimelineColumn[] = [];
    for (let i = 0; i < count; i++) {
      const start = startOfMonth(addMonthsUtc(fromMonth, i));
      const end = endOfMonth(start);
      columns.push({
        key: start,
        startDate: start,
        endDate: end,
        width: MONTH_WIDTH,
        headerTop: start.slice(0, 4),
        headerBottom: `${parseInt(start.slice(5, 7), 10)}月`,
      });
    }
    return {
      from: columns[0]!.startDate,
      to: columns[columns.length - 1]!.endDate,
      columns,
      totalWidth: count * MONTH_WIDTH,
    };
  }

  if (scale === "quarter") {
    const count = Math.max(4, Math.floor(width / QUARTER_WIDTH));
    const mid = quarterStart(anchor);
    const columns: TimelineColumn[] = [];
    let start = quarterStart(addMonthsUtc(mid, -Math.floor(count / 2) * 3));
    for (let i = 0; i < count; i++) {
      const end = quarterEnd(start);
      const q = Math.floor((parseInt(start.slice(5, 7), 10) - 1) / 3) + 1;
      columns.push({
        key: start,
        startDate: start,
        endDate: end,
        width: QUARTER_WIDTH,
        headerTop: start.slice(0, 4),
        headerBottom: `Q${q}`,
      });
      start = addMonthsUtc(start, 3);
      start = quarterStart(start);
    }
    return {
      from: columns[0]!.startDate,
      to: columns[columns.length - 1]!.endDate,
      columns,
      totalWidth: count * QUARTER_WIDTH,
    };
  }

  if (scale === "year") {
    const count = Math.max(3, Math.floor(width / YEAR_WIDTH));
    const y = parseInt(anchor.slice(0, 4), 10);
    const fromYear = y - Math.floor(count / 2);
    const columns: TimelineColumn[] = [];
    for (let i = 0; i < count; i++) {
      const year = fromYear + i;
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      columns.push({
        key: start,
        startDate: start,
        endDate: end,
        width: YEAR_WIDTH,
        headerTop: "",
        headerBottom: `${year}`,
      });
    }
    return {
      from: columns[0]!.startDate,
      to: columns[columns.length - 1]!.endDate,
      columns,
      totalWidth: count * YEAR_WIDTH,
    };
  }

  // 5year
  const count = Math.max(2, Math.floor(width / FIVE_YEAR_WIDTH));
  const blockStart = fiveYearBlockStart(anchor);
  const blockYear = parseInt(blockStart.slice(0, 4), 10);
  const fromYear = blockYear - Math.floor(count / 2) * 5;
  const columns: TimelineColumn[] = [];
  for (let i = 0; i < count; i++) {
    const y = fromYear + i * 5;
    const start = `${y}-01-01`;
    const end = `${y + 4}-12-31`;
    columns.push({
      key: start,
      startDate: start,
      endDate: end,
      width: FIVE_YEAR_WIDTH,
      headerTop: "",
      headerBottom: `${y}-${y + 4}`,
    });
  }
  return {
    from: columns[0]!.startDate,
    to: columns[columns.length - 1]!.endDate,
    columns,
    totalWidth: count * FIVE_YEAR_WIDTH,
  };
}

export function shiftAnchor(scale: GanttScaleId, anchor: string, direction: -1 | 1): string {
  switch (scale) {
    case "hour":
      return addDaysUtc(anchor, direction);
    case "day":
      return addDaysUtc(anchor, direction * 7);
    case "week":
      return addDaysUtc(anchor, direction * 7);
    case "biweek":
      return addDaysUtc(anchor, direction * 14);
    case "month":
      return addMonthsUtc(anchor, direction);
    case "quarter":
      return addMonthsUtc(anchor, direction * 3);
    case "year":
      return addMonthsUtc(anchor, direction * 12);
    case "5year":
      return addMonthsUtc(anchor, direction * 60);
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

export function xToDate(x: number, layout: TimelineLayout): string {
  const fromMs = parseUtcDate(layout.from);
  const toMs = parseUtcDate(layout.to) + 86400000;
  const span = toMs - fromMs;
  const ratio = Math.max(0, Math.min(1, x / layout.totalWidth));
  const dMs = fromMs + ratio * span;
  const dt = new Date(dMs);
  return dt.toISOString().slice(0, 10);
}

export function barMetricsFromDates(
  startDate: string,
  endDate: string,
  layout: TimelineLayout,
): { left: number; width: number } {
  const left = dateToX(startDate, layout);
  const endX = dateToX(endDate, layout);
  const dayFraction = layout.totalWidth / (daysBetween(layout.from, layout.to) + 1);
  return {
    left,
    width: Math.max(dayFraction * 0.6, endX - left + dayFraction),
  };
}

export function pixelDeltaToDays(deltaX: number, layout: TimelineLayout): number {
  const totalDays = daysBetween(layout.from, layout.to) + 1;
  const dayWidth = layout.totalWidth / totalDays;
  return Math.round(deltaX / dayWidth);
}

export function monthHeaderSpans(columns: TimelineColumn[]) {
  const spans: { label: string; count: number; width: number }[] = [];
  for (const col of columns) {
    const label = col.headerTop || col.headerBottom;
    const last = spans[spans.length - 1];
    if (last?.label === label) {
      last.count++;
      last.width += col.width;
    } else {
      spans.push({ label, count: 1, width: col.width });
    }
  }
  return spans;
}

export function compactTimelineRange() {
  const today = todayStr();
  return { from: addDaysUtc(today, -30), to: addDaysUtc(today, 45) };
}

export function buildDayList(from: string, to: string) {
  const days: string[] = [];
  let cur = from;
  while (cur <= to) {
    days.push(cur);
    cur = addDaysUtc(cur, 1);
  }
  return days;
}

export function monthSpans(days: string[]) {
  const spans: { label: string; count: number }[] = [];
  for (const d of days) {
    const dt = new Date(parseUtcDate(d));
    const label = `${dt.getUTCFullYear()}年${dt.getUTCMonth() + 1}月`;
    const last = spans[spans.length - 1];
    if (last?.label === label) last.count++;
    else spans.push({ label, count: 1 });
  }
  return spans;
}

const DAY_WIDTH_COMPACT = 32;

export function buildCompactLayout(from: string, to: string): TimelineLayout {
  const days = buildDayList(from, to);
  const columns: TimelineColumn[] = days.map((day) => ({
    key: day,
    startDate: day,
    endDate: day,
    width: DAY_WIDTH_COMPACT,
    headerTop: formatMonthLabel(day),
    headerBottom: day.slice(8, 10),
  }));
  return {
    from,
    to,
    columns,
    totalWidth: days.length * DAY_WIDTH_COMPACT,
  };
}
