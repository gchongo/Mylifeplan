export type ThemePreference = "system" | "light" | "dark";
export type LanguagePreference = "zh-CN" | "en-US";
export type GanttActualLineStyle = "solid" | "dashed" | "dotted";

export interface GanttActualLinePreferences {
  enabled: boolean;
  color: string;
  width: 1 | 2 | 3;
  style: GanttActualLineStyle;
}

export interface UserPreferences {
  timezone: string;
  theme: ThemePreference;
  language: LanguagePreference;
  ganttActualLine: GanttActualLinePreferences;
}

export const USER_PREFERENCES_STORAGE_KEY = "mylifeplan-user-preferences";

export const DEFAULT_GANTT_ACTUAL_LINE: GanttActualLinePreferences = {
  enabled: true,
  color: "#111827",
  width: 2,
  style: "solid",
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  timezone: "auto",
  theme: "system",
  language: "zh-CN",
  ganttActualLine: DEFAULT_GANTT_ACTUAL_LINE,
};

export const TIMEZONE_OPTIONS = [
  { value: "auto", label: "跟随系统（浏览器）" },
  { value: "Asia/Shanghai", label: "中国标准时间 (UTC+8)" },
  { value: "Asia/Tokyo", label: "日本标准时间 (UTC+9)" },
  { value: "Asia/Singapore", label: "新加坡 (UTC+8)" },
  { value: "Europe/London", label: "伦敦 (UTC+0/+1)" },
  { value: "America/New_York", label: "纽约 (UTC-5/-4)" },
  { value: "America/Los_Angeles", label: "洛杉矶 (UTC-8/-7)" },
  { value: "UTC", label: "协调世界时 (UTC)" },
] as const;

export const THEME_OPTIONS = [
  { value: "system", label: "跟随系统" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en-US", label: "English" },
] as const;

export const GANTT_ACTUAL_LINE_STYLE_OPTIONS = [
  { value: "solid", label: "实线" },
  { value: "dashed", label: "虚线" },
  { value: "dotted", label: "点线" },
] as const;

export const GANTT_ACTUAL_LINE_WIDTH_OPTIONS = [
  { value: 1, label: "细" },
  { value: 2, label: "中" },
  { value: 3, label: "粗" },
] as const;

const GANTT_ACTUAL_LINE_COLORS = [
  "#4B5563",
  "#1F2937",
  "#6366F1",
  "#2563EB",
  "#0891B2",
  "#059669",
  "#CA8A04",
  "#DC2626",
  "#DB2777",
] as const;

function isTheme(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function isLanguage(value: unknown): value is LanguagePreference {
  return value === "zh-CN" || value === "en-US";
}

function isLineStyle(value: unknown): value is GanttActualLineStyle {
  return value === "solid" || value === "dashed" || value === "dotted";
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function normalizeGanttActualLinePreferences(
  raw: Partial<GanttActualLinePreferences> | null | undefined,
): GanttActualLinePreferences {
  const widthRaw = raw?.width;
  const width: 1 | 2 | 3 =
    widthRaw === 1 || widthRaw === 2 || widthRaw === 3 ? widthRaw : DEFAULT_GANTT_ACTUAL_LINE.width;
  return {
    enabled: typeof raw?.enabled === "boolean" ? raw.enabled : DEFAULT_GANTT_ACTUAL_LINE.enabled,
    color: isHexColor(raw?.color) ? raw.color : DEFAULT_GANTT_ACTUAL_LINE.color,
    width,
    style: isLineStyle(raw?.style) ? raw.style : DEFAULT_GANTT_ACTUAL_LINE.style,
  };
}

export function normalizeUserPreferences(raw: Partial<UserPreferences> | null | undefined): UserPreferences {
  const timezone =
    typeof raw?.timezone === "string" && raw.timezone.trim()
      ? raw.timezone.trim()
      : DEFAULT_USER_PREFERENCES.timezone;
  return {
    timezone,
    theme: isTheme(raw?.theme) ? raw.theme : DEFAULT_USER_PREFERENCES.theme,
    language: isLanguage(raw?.language) ? raw.language : DEFAULT_USER_PREFERENCES.language,
    ganttActualLine: normalizeGanttActualLinePreferences(raw?.ganttActualLine),
  };
}

export function readUserPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_USER_PREFERENCES;
  try {
    const raw = localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;
    return normalizeUserPreferences(JSON.parse(raw) as Partial<UserPreferences>);
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function writeUserPreferences(prefs: UserPreferences) {
  localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
}

export function resolveTimezone(pref: string): string {
  if (pref === "auto" || !pref) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return pref;
}

export function applyThemePreference(theme: ThemePreference) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
    return;
  }

  root.classList.add(theme);
}

export function applyLanguagePreference(language: LanguagePreference) {
  document.documentElement.lang = language;
}

export function applyUserPreferences(prefs: UserPreferences) {
  applyThemePreference(prefs.theme);
  applyLanguagePreference(prefs.language);
}

export { GANTT_ACTUAL_LINE_COLORS };
