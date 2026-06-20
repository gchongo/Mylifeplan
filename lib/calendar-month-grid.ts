export const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export const MONTH_NAMES = [
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

export type MonthKey = { year: number; month: number };

export function monthKeyId(key: MonthKey): string {
  return `${key.year}-${key.month}`;
}

export function monthKeyFromDate(date: Date): MonthKey {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const d = new Date(Date.UTC(key.year, key.month + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

export function compareMonthKeys(a: MonthKey, b: MonthKey): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

/** Monday-based offset (0 = Mon … 6 = Sun) */
export function mondayOffset(year: number, month: number): number {
  const dow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function monthRangeBounds(key: MonthKey): { from: string; to: string } {
  const from = toDateStr(key.year, key.month, 1);
  const to = toDateStr(key.year, key.month, daysInMonth(key.year, key.month));
  return { from, to };
}

export function rangeForMonths(months: MonthKey[]): { from: string; to: string } {
  if (months.length === 0) {
    const now = monthKeyFromDate(new Date());
    return monthRangeBounds(now);
  }
  const sorted = [...months].sort(compareMonthKeys);
  const first = monthRangeBounds(sorted[0]!);
  const last = monthRangeBounds(sorted[sorted.length - 1]!);
  return { from: first.from, to: last.to };
}

export function formatMonthTitle(key: MonthKey, showYear: boolean): string {
  const name = MONTH_NAMES[key.month]!;
  return showYear ? `${key.year}年${key.month + 1}月` : name;
}

export function buildMonthCells(year: number, month: number): (number | null)[] {
  const leading = mondayOffset(year, month);
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

export function initialMonthWindow(anchor: MonthKey, before = 6, after = 6): MonthKey[] {
  const months: MonthKey[] = [];
  for (let i = -before; i <= after; i++) {
    months.push(addMonths(anchor, i));
  }
  return months;
}

export function extendMonths(months: MonthKey[], delta: number, at: "start" | "end"): MonthKey[] {
  const sorted = [...months].sort(compareMonthKeys);
  if (at === "start") {
    const first = sorted[0]!;
    const added: MonthKey[] = [];
    for (let i = delta; i >= 1; i--) added.push(addMonths(first, -i));
    return [...added, ...sorted];
  }
  const last = sorted[sorted.length - 1]!;
  const added: MonthKey[] = [];
  for (let i = 1; i <= delta; i++) added.push(addMonths(last, i));
  return [...sorted, ...added];
}
