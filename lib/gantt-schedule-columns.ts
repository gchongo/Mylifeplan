import { parsePlanDateTime } from "@/lib/dates";
import { formatCompletionPercent, planCompletionPercent } from "@/lib/gantt-plan-completion";
import type { GanttItem } from "@/types";

export const GANTT_TITLE_COL_WIDTH = 140;
export const GANTT_SCHEDULE_COLUMNS_STORAGE_KEY = "mylifeplan-gantt-schedule-columns";

export const GANTT_SCHEDULE_COLUMN_IDS = [
  "planStart",
  "planEnd",
  "planDays",
  "actualStart",
  "actualEnd",
  "actualDays",
  "completion",
] as const;

export type GanttScheduleColumnId = (typeof GANTT_SCHEDULE_COLUMN_IDS)[number];

export interface GanttScheduleColumnDef {
  id: GanttScheduleColumnId;
  label: string;
  shortLabel: string;
  width: number;
}

export const GANTT_SCHEDULE_COLUMNS: GanttScheduleColumnDef[] = [
  { id: "planStart", label: "计划开始", shortLabel: "计开", width: 78 },
  { id: "planEnd", label: "计划结束", shortLabel: "计止", width: 78 },
  { id: "planDays", label: "计划天数", shortLabel: "计天", width: 52 },
  { id: "actualStart", label: "实际开始", shortLabel: "实开", width: 78 },
  { id: "actualEnd", label: "实际结束", shortLabel: "实止", width: 78 },
  { id: "actualDays", label: "实际天数", shortLabel: "实天", width: 52 },
  { id: "completion", label: "完成率", shortLabel: "%", width: 48 },
];

const COLUMN_BY_ID = new Map(GANTT_SCHEDULE_COLUMNS.map((c) => [c.id, c]));

export const DEFAULT_VISIBLE_SCHEDULE_COLUMNS: GanttScheduleColumnId[] = [
  "planStart",
  "planEnd",
  "actualStart",
  "actualEnd",
  "completion",
];

export function readStoredScheduleColumns(): GanttScheduleColumnId[] {
  if (typeof window === "undefined") return DEFAULT_VISIBLE_SCHEDULE_COLUMNS;
  try {
    const raw = localStorage.getItem(GANTT_SCHEDULE_COLUMNS_STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE_SCHEDULE_COLUMNS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_VISIBLE_SCHEDULE_COLUMNS;
    const valid = parsed.filter((id): id is GanttScheduleColumnId =>
      GANTT_SCHEDULE_COLUMN_IDS.includes(id as GanttScheduleColumnId),
    );
    return valid.length > 0 ? valid : DEFAULT_VISIBLE_SCHEDULE_COLUMNS;
  } catch {
    return DEFAULT_VISIBLE_SCHEDULE_COLUMNS;
  }
}

export function writeStoredScheduleColumns(ids: GanttScheduleColumnId[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GANTT_SCHEDULE_COLUMNS_STORAGE_KEY, JSON.stringify(ids));
}

export function visibleScheduleColumnDefs(ids: GanttScheduleColumnId[]): GanttScheduleColumnDef[] {
  return ids.map((id) => COLUMN_BY_ID.get(id)!).filter(Boolean);
}

export function scheduleColumnsTotalWidth(ids: GanttScheduleColumnId[]): number {
  return visibleScheduleColumnDefs(ids).reduce((sum, c) => sum + c.width, 0);
}

function formatScheduleDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = parsePlanDateTime(value);
  if (!d) return "—";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function daySpanMs(start: string, end: string): number | null {
  const a = parsePlanDateTime(start)?.getTime();
  const b = parsePlanDateTime(end)?.getTime();
  if (a == null || b == null) return null;
  return Math.max(0, b - a);
}

function formatDayCount(ms: number | null): string {
  if (ms === null) return "—";
  const days = Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)) + 1);
  return String(days);
}

export interface ScheduleCellValue {
  text: string;
  muted?: boolean;
  virtual?: boolean;
  highlight?: boolean;
}

export function getScheduleCellValue(
  columnId: GanttScheduleColumnId,
  item: GanttItem,
  allPlans: GanttItem[],
): ScheduleCellValue {
  switch (columnId) {
    case "planStart":
      return { text: formatScheduleDate(item.startDate), muted: !item.startDate };
    case "planEnd": {
      if (item.endDate) return { text: formatScheduleDate(item.endDate) };
      if (item.isVirtualEnd && item.effectiveEnd) {
        return { text: formatScheduleDate(item.effectiveEnd), virtual: true };
      }
      return { text: "—", muted: true };
    }
    case "planDays": {
      const end = item.endDate ?? (item.isVirtualEnd ? item.effectiveEnd : null);
      if (!item.startDate || !end) return { text: "—", muted: true };
      return { text: formatDayCount(daySpanMs(item.startDate, end)) };
    }
    case "actualStart":
      return { text: formatScheduleDate(item.actualStartDate), muted: !item.actualStartDate };
    case "actualEnd":
      return { text: formatScheduleDate(item.actualEndDate), muted: !item.actualEndDate };
    case "actualDays": {
      if (!item.actualStartDate) return { text: "—", muted: true };
      const end = item.actualEndDate ?? null;
      if (!end) return { text: "—", muted: true };
      return { text: formatDayCount(daySpanMs(item.actualStartDate, end)) };
    }
    case "completion": {
      const pct = planCompletionPercent(item, allPlans);
      return {
        text: formatCompletionPercent(pct),
        highlight: pct === 100,
        muted: pct === null,
      };
    }
    default:
      return { text: "—" };
  }
}
