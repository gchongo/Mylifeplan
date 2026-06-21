import { resolveVisualStatus } from "@/lib/task-status-style";
import { datePartOf, formatPlanDateTimeCompact } from "@/lib/dates";
import type { CalendarItem } from "@/types";

export type CalendarDisplayMode = "compact" | "stacked" | "detailed";

export type CalendarViewMode = "day" | "week" | "month" | "year";

export const CALENDAR_VIEW_MODES: { id: CalendarViewMode; label: string }[] = [
  { id: "day", label: "天" },
  { id: "week", label: "周" },
  { id: "month", label: "月" },
  { id: "year", label: "年" },
];

export const CALENDAR_DISPLAY_MODES: {
  id: CalendarDisplayMode;
  label: string;
  hint: string;
}[] = [
  { id: "compact", label: "紧凑", hint: "底部色点/细条，占用最少空间" },
  { id: "stacked", label: "叠放", hint: "彩色条目叠放，适合浏览整月" },
  { id: "detailed", label: "详细信息", hint: "显示标题与时间" },
];

const STORAGE_KEY = "mylifeplan-calendar-display";
export const CALENDAR_MOBILE_BREAKPOINT = 768;

export function isMobileCalendarViewport(
  width = typeof window !== "undefined" ? window.innerWidth : CALENDAR_MOBILE_BREAKPOINT,
): boolean {
  return width < CALENDAR_MOBILE_BREAKPOINT;
}

export function displayModesForViewport(isMobile: boolean) {
  return isMobile
    ? CALENDAR_DISPLAY_MODES
    : CALENDAR_DISPLAY_MODES.filter((m) => m.id === "detailed");
}

export function normalizeDisplayMode(
  mode: CalendarDisplayMode,
  isMobile: boolean,
): CalendarDisplayMode {
  if (!isMobile && mode !== "detailed") return "detailed";
  return mode;
}

export function defaultCalendarDisplayMode(isMobile = isMobileCalendarViewport()): CalendarDisplayMode {
  return isMobile ? "stacked" : "detailed";
}

export function loadCalendarDisplayMode(isMobile = isMobileCalendarViewport()): CalendarDisplayMode {
  if (typeof window === "undefined") return "detailed";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "list") return defaultCalendarDisplayMode(isMobile);
  const stored = CALENDAR_DISPLAY_MODES.some((m) => m.id === raw)
    ? (raw as CalendarDisplayMode)
    : defaultCalendarDisplayMode(isMobile);
  return normalizeDisplayMode(stored, isMobile);
}

export function saveCalendarDisplayMode(mode: CalendarDisplayMode) {
  localStorage.setItem(STORAGE_KEY, mode);
}

export function itemsOnDate(items: CalendarItem[], dateStr: string): CalendarItem[] {
  return items.filter((item) => {
    const start = datePartOf(item.startDate);
    const end = datePartOf(item.endDate ?? item.startDate);
    if (!start || !end) return false;
    return start <= dateStr && dateStr <= end;
  });
}

export function formatDayDrawerTitle(dateStr: string, count: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${y}年${m}月${d}日 · ${count} 项`;
}

export function itemAccent(item: CalendarItem): {
  bar: string;
  dot: string;
  text: string;
  soft: string;
} {
  const key = resolveVisualStatus(item.status, item.endDate, undefined, item.overdue);
  switch (key) {
    case "done":
      return { bar: "bg-emerald-500", dot: "bg-emerald-500", text: "text-emerald-800", soft: "bg-emerald-100" };
    case "in_progress":
      return { bar: "bg-blue-500", dot: "bg-blue-500", text: "text-blue-800", soft: "bg-blue-100" };
    case "overdue":
      return { bar: "bg-red-500", dot: "bg-red-500", text: "text-red-800", soft: "bg-red-100" };
    case "archived":
      return { bar: "bg-gray-400", dot: "bg-gray-400", text: "text-gray-600", soft: "bg-gray-100" };
    default:
      return { bar: "bg-amber-500", dot: "bg-amber-500", text: "text-amber-800", soft: "bg-amber-100" };
  }
}

export function formatEventSchedule(item: CalendarItem): string {
  const start = item.startDate;
  const end = item.endDate;
  if (!end || datePartOf(end) === datePartOf(start)) {
    return formatPlanDateTimeCompact(start);
  }
  return `${formatPlanDateTimeCompact(start)} → ${formatPlanDateTimeCompact(end)}`;
}

export function displayLimits(mode: CalendarDisplayMode, fullPage: boolean) {
  switch (mode) {
    case "compact":
      return { show: 4, cellMin: fullPage ? "min-h-[4rem]" : "min-h-[3.25rem]" };
    case "stacked":
      return { show: fullPage ? 3 : 2, cellMin: fullPage ? "min-h-[7rem]" : "min-h-[5.5rem]" };
    case "detailed":
      return { show: fullPage ? 4 : 3, cellMin: fullPage ? "min-h-[8rem]" : "min-h-[6rem]" };
  }
}
