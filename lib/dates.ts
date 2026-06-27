/** 本地日历日期 YYYY-MM-DD */
export function localDateStr(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 今天（本地时区） */
export function todayStr(): string {
  return localDateStr();
}

/** 将 YYYY-MM-DD 转为 UTC 日期 */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateOnly(value: Date | null | undefined): string | null {
  if (!value) return null;
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString().slice(0, 10);
}

/** 解析日期或 datetime-local / ISO 字符串 */
export type PlanDateTimeEdge = "start" | "end";

/** Node 上无时区 datetime 默认按中国标准时间理解（与主要用户群一致） */
const SERVER_NAIVE_WALL_CLOCK_ZONE = "Asia/Shanghai";

/** 将某时区墙上的 YYYY-MM-DD HH:mm 转为 UTC 时刻（供 Node 解析无时区字符串） */
export function wallClockInZoneToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  min: number,
  timeZone: string,
): Date {
  const desiredUtc = Date.UTC(y, mo - 1, d, h, min);
  const probe = new Date(desiredUtc);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(probe);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const shownUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
  );
  return new Date(probe.getTime() + (desiredUtc - shownUtc));
}

function parseDateOnlyLocal(value: string, edge: PlanDateTimeEdge): Date {
  const [y, m, d] = value.split("-").map(Number);
  if (typeof window === "undefined") {
    if (edge === "end") {
      const end = wallClockInZoneToUtc(y, m, d, 23, 59, SERVER_NAIVE_WALL_CLOCK_ZONE);
      return new Date(end.getTime() + 59_999);
    }
    return wallClockInZoneToUtc(y, m, d, 0, 0, SERVER_NAIVE_WALL_CLOCK_ZONE);
  }
  if (edge === "end") {
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** 手动选日未带时分时：开始类字段 00:00，结束类字段 23:59 */
export function normalizePlanDateInput(
  value: string | null | undefined,
  edge: PlanDateTimeEdge,
): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return edge === "end" ? `${trimmed}T23:59` : `${trimmed}T00:00`;
  }
  const dateTime = trimmed.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/);
  if (dateTime && edge === "end" && dateTime[2] === "00" && dateTime[3] === "00") {
    return `${dateTime[1]}T23:59`;
  }
  return trimmed;
}

export function datetimeLocalToIso(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const local = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (local) {
    const d = new Date(+local[1], +local[2] - 1, +local[3], +local[4], +local[5], 0, 0);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parsePlanDateTime(
  value: string | null | undefined,
  edge: PlanDateTimeEdge = "start",
): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const normalized = normalizePlanDateInput(trimmed, edge) ?? trimmed;
  const local = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (local) {
    const y = +local[1];
    const mo = +local[2];
    const d = +local[3];
    const h = +local[4];
    const min = +local[5];
    if (typeof window === "undefined") {
      const zoned = wallClockInZoneToUtc(y, mo, d, h, min, SERVER_NAIVE_WALL_CLOCK_ZONE);
      if (edge === "end" && h === 23 && min === 59) {
        return new Date(zoned.getTime() + 59_999);
      }
      return Number.isNaN(zoned.getTime()) ? null : zoned;
    }
    const browserLocal = new Date(y, mo - 1, d, h, min, 0, 0);
    return Number.isNaN(browserLocal.getTime()) ? null : browserLocal;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return parseDateOnlyLocal(normalized, edge);
  }
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parsePlanStartDateTime(value: string | null | undefined): Date | null {
  return parsePlanDateTime(value, "start");
}

export function parsePlanEndDateTime(value: string | null | undefined): Date | null {
  return parsePlanDateTime(value, "end");
}

export function formatPlanDateTime(value: Date | null | undefined): string | null {
  if (!value) return null;
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

/** 甘特计开/实开等列：本地日历日期 YYYY/MM/DD（与 datetime-local 一致） */
export function formatPlanLocalDateSlash(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

/** 移动端时间抽屉：YY/M/D，如 26/4/12（须单行展示） */
export function formatPlanLocalDateCompactSlash(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear() % 100}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** 供 `<input type="datetime-local" />` 使用的值 */
export function toDatetimeLocalInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 当前本地时间，供 datetime-local 输入框 */
export function nowDatetimeLocal(): string {
  return toDatetimeLocalInput(new Date());
}

export function datePartOf(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return formatDateOnly(value);
}

/** 仅日期或 UTC 零点：视为「整日」计划 */
export function isDateOnlyPlanInstant(value: string | null | undefined): boolean {
  if (!value) return false;
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

export function planLocalDatePart(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = parsePlanDateTime(value);
  if (!d) return value.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 甘特天视图：整日计划起止（本地 0:00 / 23:59） */
export function planDayStartLocalIso(date: string): string {
  return `${planLocalDatePart(date)}T00:00:00`;
}

export function planDayEndLocalIso(date: string): string {
  return `${planLocalDatePart(date)}T23:59:59`;
}

export function planRangeEdgeMs(value: string, edge: "start" | "end"): number | null {
  if (!value) return null;
  if (isDateOnlyPlanInstant(value)) {
    const [y, m, d] = planLocalDatePart(value).split("-").map(Number);
    if (edge === "start") return Date.UTC(y, m - 1, d, 0, 0, 0, 0);
    return Date.UTC(y, m - 1, d, 23, 59, 59, 999);
  }
  return parsePlanDateTime(value)?.getTime() ?? null;
}

export function formatPlanDateTimeDisplay(value: string | Date | null | undefined): string {
  if (!value) return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value} 00:00`;
  }
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  if (typeof value === "string" && value.includes("T")) {
    const utcH = d.getUTCHours();
    const utcM = d.getUTCMinutes();
    const utcS = d.getUTCSeconds();
    if (utcH === 0 && utcM === 0 && utcS === 0) {
      const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      return `${date} 00:00`;
    }
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 列表行内紧凑格式：MM-DD HH:mm */
export function formatPlanDateTimeCompact(value: string | Date | null | undefined): string {
  const full = formatPlanDateTimeDisplay(value);
  if (full === "—") return full;
  return full.slice(5);
}
