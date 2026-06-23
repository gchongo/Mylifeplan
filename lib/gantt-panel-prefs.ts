import { GANTT_TITLE_COL_WIDTH } from "@/lib/gantt-schedule-columns";

export const MIN_TITLE_WIDTH = 120;
export const MAX_TITLE_WIDTH = 360;
export const DEFAULT_TITLE_WIDTH = 200;

export const MIN_SCHEDULE_WIDTH = 120;
export const MAX_SCHEDULE_WIDTH = 480;
export const DEFAULT_SCHEDULE_WIDTH = 240;

const GANTT_TITLE_WIDTH_KEY = "mylifeplan-gantt-title-width";
const GANTT_SCHEDULE_WIDTH_KEY = "mylifeplan-gantt-schedule-width";
const GANTT_TITLE_VISIBLE_KEY = "mylifeplan-gantt-title-visible";
const GANTT_SCHEDULE_VISIBLE_KEY = "mylifeplan-gantt-schedule-visible";

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

export function readStoredTitleWidth(): number {
  if (typeof window === "undefined") return DEFAULT_TITLE_WIDTH;
  const n = parseInt(localStorage.getItem(GANTT_TITLE_WIDTH_KEY) ?? "", 10);
  if (!Number.isNaN(n)) return clamp(n, MIN_TITLE_WIDTH, MAX_TITLE_WIDTH);
  const legacy = readLegacyLabelWidth();
  if (legacy != null) {
    return clamp(Math.round(legacy * 0.42), MIN_TITLE_WIDTH, MAX_TITLE_WIDTH);
  }
  return DEFAULT_TITLE_WIDTH;
}

export function readStoredScheduleWidth(): number {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE_WIDTH;
  const n = parseInt(localStorage.getItem(GANTT_SCHEDULE_WIDTH_KEY) ?? "", 10);
  if (!Number.isNaN(n)) return clamp(n, MIN_SCHEDULE_WIDTH, MAX_SCHEDULE_WIDTH);
  const legacy = readLegacyLabelWidth();
  if (legacy != null) {
    const title = readStoredTitleWidth();
    return clamp(legacy - title, MIN_SCHEDULE_WIDTH, MAX_SCHEDULE_WIDTH);
  }
  return DEFAULT_SCHEDULE_WIDTH;
}

export function readStoredTitleVisible(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(GANTT_TITLE_VISIBLE_KEY);
  if (raw !== null) return raw !== "false";
  const legacy = readLegacyLabelVisible();
  return legacy ?? true;
}

export function readStoredScheduleVisible(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(GANTT_SCHEDULE_VISIBLE_KEY);
  if (raw !== null) return raw !== "false";
  const legacy = readLegacyLabelVisible();
  return legacy ?? true;
}

export function writeStoredTitleWidth(width: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GANTT_TITLE_WIDTH_KEY, String(width));
}

export function writeStoredScheduleWidth(width: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GANTT_SCHEDULE_WIDTH_KEY, String(width));
}

export function writeStoredTitleVisible(visible: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GANTT_TITLE_VISIBLE_KEY, String(visible));
}

export function writeStoredScheduleVisible(visible: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GANTT_SCHEDULE_VISIBLE_KEY, String(visible));
}

export { GANTT_TITLE_COL_WIDTH };
