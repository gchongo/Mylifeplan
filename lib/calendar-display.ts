import { resolveVisualStatus } from "@/lib/task-status-style";
import type { CalendarItem } from "@/types";

export type CalendarDisplayMode = "compact" | "stacked" | "detailed" | "list";

export const CALENDAR_DISPLAY_MODES: {
  id: CalendarDisplayMode;
  label: string;
  hint: string;
}[] = [
  { id: "compact", label: "紧凑", hint: "底部色点/细条，占用最少空间" },
  { id: "stacked", label: "叠放", hint: "彩色条目叠放，适合浏览整月" },
  { id: "detailed", label: "详细信息", hint: "显示标题与时间" },
  { id: "list", label: "列表", hint: "上方月历 + 下方当日列表" },
];

const STORAGE_KEY = "mylifeplan-calendar-display";

export function loadCalendarDisplayMode(): CalendarDisplayMode {
  if (typeof window === "undefined") return "stacked";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (CALENDAR_DISPLAY_MODES.some((m) => m.id === raw)) return raw as CalendarDisplayMode;
  return "stacked";
}

export function saveCalendarDisplayMode(mode: CalendarDisplayMode) {
  localStorage.setItem(STORAGE_KEY, mode);
}

export function itemsOnDate(items: CalendarItem[], dateStr: string): CalendarItem[] {
  return items.filter((item) => {
    const end = item.dueDate ?? item.startDate;
    return item.startDate <= dateStr && dateStr <= end;
  });
}

export function itemAccent(item: CalendarItem): {
  bar: string;
  dot: string;
  text: string;
  soft: string;
} {
  if (item.type === "plan") {
    return {
      bar: "bg-violet-500",
      dot: "bg-violet-500",
      text: "text-violet-800",
      soft: "bg-violet-100",
    };
  }
  const key = resolveVisualStatus(item.status, item.dueDate);
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
  if (!item.dueDate || item.dueDate === item.startDate) return "全天";
  return `${item.startDate.slice(5)} → ${item.dueDate.slice(5)}`;
}

export function displayLimits(mode: CalendarDisplayMode, fullPage: boolean) {
  switch (mode) {
    case "compact":
      return { show: 4, cellMin: fullPage ? "min-h-[3.25rem]" : "min-h-[2.75rem]" };
    case "stacked":
      return { show: fullPage ? 3 : 2, cellMin: fullPage ? "min-h-[5.5rem]" : "min-h-[4.5rem]" };
    case "detailed":
      return { show: fullPage ? 4 : 3, cellMin: fullPage ? "min-h-[5.5rem]" : "min-h-[4.5rem]" };
    case "list":
      return { show: 0, cellMin: fullPage ? "min-h-[2.75rem]" : "min-h-[2.25rem]" };
  }
}
