/**
 * 内容分流核心 — 按 docs/data-model.md 第 7 节实现。
 * M2 阶段补全完整逻辑与单测。
 */

import { formatPlanDateTime, isDateOnlyPlanInstant, parsePlanDateTime } from "@/lib/dates";

export const DEFAULT_GANTT_SPAN_DAYS = 365;

export type RoutableEntity = {
  startDate?: string | Date | null;
  dueDate?: string | Date | null;
  endDate?: string | Date | null;
};

function toDateOnly(value: string | Date): Date {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeEndString(end: string | Date): string {
  if (typeof end === "string") {
    if (isDateOnlyPlanInstant(end)) return end.slice(0, 10);
    const parsed = parsePlanDateTime(end);
    return parsed ? formatPlanDateTime(parsed)! : end;
  }
  const iso = formatPlanDateTime(end);
  if (!iso) return formatDate(toDateOnly(end));
  return isDateOnlyPlanInstant(iso) ? iso.slice(0, 10) : iso;
}

export function getEffectiveEndDate(
  item: RoutableEntity,
  today: Date = new Date(),
): { effectiveEnd: string | null; isVirtualEnd: boolean } {
  const start = item.startDate ? toDateOnly(item.startDate) : null;
  const end = item.dueDate ?? item.endDate;

  if (end) {
    return { effectiveEnd: normalizeEndString(end), isVirtualEnd: false };
  }

  if (!start) {
    return { effectiveEnd: null, isVirtualEnd: false };
  }

  const todayDate = toDateOnly(today);
  const defaultEnd = addDays(start, DEFAULT_GANTT_SPAN_DAYS);
  const effective = defaultEnd < todayDate ? todayDate : defaultEnd;
  return { effectiveEnd: formatDate(effective), isVirtualEnd: true };
}

export function shouldShowInCalendar(item: RoutableEntity): boolean {
  return Boolean(item.startDate);
}

export function shouldShowInGantt(item: RoutableEntity): boolean {
  return Boolean(item.startDate);
}

export function isPlanUnscheduled(item: RoutableEntity): boolean {
  const hasStart = Boolean(item.startDate);
  const hasEnd = Boolean(item.dueDate ?? item.endDate);
  return !hasStart && !hasEnd;
}

/** @deprecated B 模型下不再自动同步；仅保留排期判定复用 */
export function shouldShowInMemo(
  item: RoutableEntity & { parentPlanId?: string | null },
): boolean {
  if (!isPlanUnscheduled(item)) return false;
  return !item.parentPlanId;
}

export function validateDateFields(item: RoutableEntity): string | null {
  const hasStart = Boolean(item.startDate);
  const hasEnd = Boolean(item.dueDate ?? item.endDate);

  if (!hasStart && hasEnd) {
    return "填写结束时间前必须先填写开始时间";
  }

  if (hasStart && hasEnd) {
    const start = new Date(item.startDate!);
    const end = new Date((item.dueDate ?? item.endDate)!);
    if (end < start) {
      return "结束时间不能早于开始时间";
    }
  }

  return null;
}
