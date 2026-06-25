import { readStorageItem, writeStorageItem } from "@/lib/app-storage";
import {
  GANTT_SCHEDULE_UNIFORM_COL_WIDTH,
  GANTT_TITLE_COL_WIDTH,
} from "@/lib/gantt-schedule-columns";

export const MIN_TITLE_WIDTH = 120;
export const MAX_TITLE_WIDTH = 360;
export const DEFAULT_TITLE_WIDTH = 200;

export const MIN_SCHEDULE_VIEWPORT_COLS = 1;
export const MAX_SCHEDULE_VIEWPORT_COLS = 7;
export const DEFAULT_SCHEDULE_VIEWPORT_COLS = 3;

const GANTT_TITLE_WIDTH_KEY = "meridian-gantt-title-width";
const GANTT_SCHEDULE_VIEWPORT_COLS_KEY = "meridian-gantt-schedule-viewport-cols";
const GANTT_SCHEDULE_WIDTH_KEY = "meridian-gantt-schedule-width";
const GANTT_TITLE_VISIBLE_KEY = "meridian-gantt-title-visible";
const GANTT_SCHEDULE_VISIBLE_KEY = "meridian-gantt-schedule-visible";

/** @deprecated migrated on read */
const GANTT_LABEL_WIDTH_KEY = "mylifeplan-gantt-label-width";
/** @deprecated migrated on read */
const GANTT_LABEL_VISIBLE_KEY = "mylifeplan-gantt-label-visible";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function readLegacyLabelWidth(): number | null {
  if (typeof window === "undefined") return null;
  const n = parseInt(localStorage.getItem(GANTT_LABEL_WIDTH_KEY) ?? "", 10);
  return Number.isNaN(n) ? null : n;
}

function readLegacyLabelVisible(): boolean | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(GANTT_LABEL_VISIBLE_KEY);
  return raw === null ? null : raw !== "false";
}

export function scheduleWidthFromViewportCols(cols: number): number {
  return cols * GANTT_SCHEDULE_UNIFORM_COL_WIDTH;
}

export function viewportColsFromScheduleWidth(width: number): number {
  return clamp(
    Math.round(width / GANTT_SCHEDULE_UNIFORM_COL_WIDTH),
    MIN_SCHEDULE_VIEWPORT_COLS,
    MAX_SCHEDULE_VIEWPORT_COLS,
  );
}

export function readStoredTitleWidth(): number {
  if (typeof window === "undefined") return DEFAULT_TITLE_WIDTH;
  const n = parseInt(readStorageItem(GANTT_TITLE_WIDTH_KEY) ?? "", 10);
  if (!Number.isNaN(n)) return clamp(n, MIN_TITLE_WIDTH, MAX_TITLE_WIDTH);
  const legacy = readLegacyLabelWidth();
  if (legacy != null) {
    return clamp(Math.round(legacy * 0.42), MIN_TITLE_WIDTH, MAX_TITLE_WIDTH);
  }
  return DEFAULT_TITLE_WIDTH;
}

export function readStoredScheduleViewportCols(): number {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE_VIEWPORT_COLS;
  const colsRaw = parseInt(readStorageItem(GANTT_SCHEDULE_VIEWPORT_COLS_KEY) ?? "", 10);
  if (!Number.isNaN(colsRaw)) {
    return clamp(colsRaw, MIN_SCHEDULE_VIEWPORT_COLS, MAX_SCHEDULE_VIEWPORT_COLS);
  }
  const widthRaw = parseInt(readStorageItem(GANTT_SCHEDULE_WIDTH_KEY) ?? "", 10);
  if (!Number.isNaN(widthRaw)) {
    return viewportColsFromScheduleWidth(widthRaw);
  }
  const legacy = readLegacyLabelWidth();
  if (legacy != null) {
    const title = readStoredTitleWidth();
    return viewportColsFromScheduleWidth(Math.max(GANTT_SCHEDULE_UNIFORM_COL_WIDTH, legacy - title));
  }
  return DEFAULT_SCHEDULE_VIEWPORT_COLS;
}

export function readStoredTitleVisible(): boolean {
  if (typeof window === "undefined") return true;
  const raw = readStorageItem(GANTT_TITLE_VISIBLE_KEY);
  if (raw !== null) return raw !== "false";
  const legacy = readLegacyLabelVisible();
  return legacy ?? true;
}

export function readStoredScheduleVisible(): boolean {
  if (typeof window === "undefined") return true;
  const raw = readStorageItem(GANTT_SCHEDULE_VISIBLE_KEY);
  if (raw !== null) return raw !== "false";
  const legacy = readLegacyLabelVisible();
  return legacy ?? true;
}

export function writeStoredTitleWidth(width: number) {
  if (typeof window === "undefined") return;
  writeStorageItem(GANTT_TITLE_WIDTH_KEY, String(width));
}

export function writeStoredScheduleViewportCols(cols: number) {
  if (typeof window === "undefined") return;
  writeStorageItem(GANTT_SCHEDULE_VIEWPORT_COLS_KEY, String(cols));
  writeStorageItem(
    GANTT_SCHEDULE_WIDTH_KEY,
    String(scheduleWidthFromViewportCols(cols)),
  );
}

export function writeStoredTitleVisible(visible: boolean) {
  if (typeof window === "undefined") return;
  writeStorageItem(GANTT_TITLE_VISIBLE_KEY, String(visible));
}

export function writeStoredScheduleVisible(visible: boolean) {
  if (typeof window === "undefined") return;
  writeStorageItem(GANTT_SCHEDULE_VISIBLE_KEY, String(visible));
}

export { GANTT_TITLE_COL_WIDTH };
