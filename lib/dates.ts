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
  return value.toISOString().slice(0, 10);
}

/** 解析日期或 datetime-local / ISO 字符串 */
export function parsePlanDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return parseDateOnly(trimmed);
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatPlanDateTime(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

/** 供 `<input type="datetime-local" />` 使用的值 */
export function toDatetimeLocalInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datePartOf(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return formatDateOnly(value);
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
