import { parsePlanDateTime, formatPlanLocalDateSlash } from "@/lib/dates";
import { formatCompletionPercent, planCompletionPercent } from "@/lib/gantt-plan-completion";
import type { GanttItem } from "@/types";

export const GANTT_TITLE_COL_WIDTH = 140;
export const GANTT_SCHEDULE_TABLE_HEADER_HEIGHT = 26;
export const GANTT_SCHEDULE_UNIFORM_COL_WIDTH = 72;
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
  { id: "completion", label: "完成率", shortLabel: "完成率%", width: 48 },
];

const COLUMN_BY_ID = new Map(GANTT_SCHEDULE_COLUMNS.map((c) => [c.id, c]));

export const DEFAULT_VISIBLE_SCHEDULE_COLUMNS: GanttScheduleColumnId[] = [...GANTT_SCHEDULE_COLUMN_IDS];

/** @deprecated previous default omitted planDays and actualDays */
const LEGACY_DEFAULT_VISIBLE_SCHEDULE_COLUMNS: GanttScheduleColumnId[] = [
  "planStart",
  "planEnd",
  "actualStart",
  "actualEnd",
  "completion",
];

function isLegacyDefaultScheduleColumns(ids: GanttScheduleColumnId[]): boolean {
  return (
    ids.length === LEGACY_DEFAULT_VISIBLE_SCHEDULE_COLUMNS.length &&
    LEGACY_DEFAULT_VISIBLE_SCHEDULE_COLUMNS.every((id, i) => ids[i] === id)
  );
}

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
    if (valid.length === 0) return DEFAULT_VISIBLE_SCHEDULE_COLUMNS;
    if (isLegacyDefaultScheduleColumns(valid)) return DEFAULT_VISIBLE_SCHEDULE_COLUMNS;
    return valid;
  } catch {
    return DEFAULT_VISIBLE_SCHEDULE_COLUMNS;
  }
}

export function writeStoredScheduleColumns(ids: GanttScheduleColumnId[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GANTT_SCHEDULE_COLUMNS_STORAGE_KEY, JSON.stringify(ids));
}

export function visibleScheduleColumnDefs(ids: GanttScheduleColumnId[]): GanttScheduleColumnDef[] {
  return ids
    .map((id) => COLUMN_BY_ID.get(id)!)
    .filter(Boolean)
    .map((col) => ({ ...col, width: GANTT_SCHEDULE_UNIFORM_COL_WIDTH }));
}

export function scheduleColumnsTotalWidth(ids: GanttScheduleColumnId[]): number {
  return ids.length * GANTT_SCHEDULE_UNIFORM_COL_WIDTH;
}

export function scheduleScrollLeftForIndex(index: number): number {
  return Math.max(0, index) * GANTT_SCHEDULE_UNIFORM_COL_WIDTH;
}

export function scheduleColumnIndexAtScroll(scrollLeft: number): number {
  return Math.max(0, Math.round(scrollLeft / GANTT_SCHEDULE_UNIFORM_COL_WIDTH));
}

export const GANTT_SCHEDULE_EDITABLE_COLUMN_IDS = [
  "planStart",
  "planEnd",
  "actualStart",
  "actualEnd",
] as const;

export type GanttScheduleEditableColumnId = (typeof GANTT_SCHEDULE_EDITABLE_COLUMN_IDS)[number];

export function isScheduleColumnEditable(
  id: GanttScheduleColumnId,
): id is GanttScheduleEditableColumnId {
  return (GANTT_SCHEDULE_EDITABLE_COLUMN_IDS as readonly string[]).includes(id);
}

export function scheduleColumnPlanField(
  id: GanttScheduleEditableColumnId,
): "startDate" | "endDate" | "actualStartDate" | "actualEndDate" {
  switch (id) {
    case "planStart":
      return "startDate";
    case "planEnd":
      return "endDate";
    case "actualStart":
      return "actualStartDate";
    case "actualEnd":
      return "actualEndDate";
  }
}

export function getScheduleEditRawValue(
  columnId: GanttScheduleEditableColumnId,
  item: GanttItem,
): string | null {
  switch (columnId) {
    case "planStart":
      return item.startDate ?? null;
    case "planEnd":
      return item.endDate ?? null;
    case "actualStart":
      return item.actualStartDate ?? null;
    case "actualEnd":
      return item.actualEndDate ?? null;
  }
}

export function planHasRollupActuals(planId: string, allPlans: GanttItem[]): boolean {
  return allPlans.some(
    (p) => p.parentId === planId && p.status !== "archived",
  );
}

export function isScheduleCellEditable(
  columnId: GanttScheduleColumnId,
  item: GanttItem,
  allPlans: GanttItem[],
): boolean {
  if (!isScheduleColumnEditable(columnId)) return false;
  if (item.contributionOnly) return false;
  if (
    (columnId === "actualStart" || columnId === "actualEnd") &&
    planHasRollupActuals(item.id, allPlans)
  ) {
    return false;
  }
  return true;
}

function formatScheduleDate(value: string | null | undefined): string {
  if (!value) return "—";
  return formatPlanLocalDateSlash(value);
}

function daySpanMs(start: string, end: string): number | null {
  const a = parsePlanDateTime(start, "start")?.getTime();
  const b = parsePlanDateTime(end, "end")?.getTime();
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

function hasRealPlanEnd(item: Pick<GanttItem, "endDate" | "isVirtualEnd">): boolean {
  return Boolean(item.endDate) && !item.isVirtualEnd;
}

export function getScheduleCellValue(
  columnId: GanttScheduleColumnId,
  item: GanttItem,
  allPlans: GanttItem[],
): ScheduleCellValue {
  switch (columnId) {
    case "planStart":
      return { text: formatScheduleDate(item.startDate), muted: !item.startDate };
    case "planEnd":
      return hasRealPlanEnd(item)
        ? { text: formatScheduleDate(item.endDate) }
        : { text: "—", muted: true };
    case "planDays": {
      if (!item.startDate || !hasRealPlanEnd(item)) return { text: "—", muted: true };
      return { text: formatDayCount(daySpanMs(item.startDate, item.endDate!)) };
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
