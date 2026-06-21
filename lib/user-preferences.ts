export type ThemePreference = "system" | "light" | "dark";
export type LanguagePreference = "zh-CN" | "en-US";

export type ContributionMarkerSize = "xs" | "sm" | "md";
export type ContributionMarkerShape = "circle" | "square" | "diamond";

export interface ContributionMarkerPreferences {
  color: string;
  size: ContributionMarkerSize;
  shape: ContributionMarkerShape;
}

export interface UserPreferences {
  timezone: string;
  theme: ThemePreference;
  language: LanguagePreference;
  contributionMarker: ContributionMarkerPreferences;
}

export const DEFAULT_CONTRIBUTION_MARKER: ContributionMarkerPreferences = {
  color: "#6366F1",
  size: "xs",
  shape: "circle",
};

export const USER_PREFERENCES_STORAGE_KEY = "mylifeplan-user-preferences";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  timezone: "auto",
  theme: "system",
  language: "zh-CN",
  contributionMarker: DEFAULT_CONTRIBUTION_MARKER,
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

export const CONTRIBUTION_MARKER_SIZE_OPTIONS = [
  { value: "xs", label: "小（8px）" },
  { value: "sm", label: "中（10px）" },
  { value: "md", label: "大（12px）" },
] as const;

export const CONTRIBUTION_MARKER_SHAPE_OPTIONS = [
  { value: "circle", label: "圆形" },
  { value: "square", label: "方形" },
  { value: "diamond", label: "菱形" },
] as const;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function isMarkerSize(value: unknown): value is ContributionMarkerSize {
  return value === "xs" || value === "sm" || value === "md";
}

function isMarkerShape(value: unknown): value is ContributionMarkerShape {
  return value === "circle" || value === "square" || value === "diamond";
}

function normalizeContributionMarker(
  raw: Partial<ContributionMarkerPreferences> | null | undefined,
): ContributionMarkerPreferences {
  const color =
    typeof raw?.color === "string" && HEX_COLOR.test(raw.color)
      ? raw.color
      : DEFAULT_CONTRIBUTION_MARKER.color;
  return {
    color,
    size: isMarkerSize(raw?.size) ? raw.size : DEFAULT_CONTRIBUTION_MARKER.size,
    shape: isMarkerShape(raw?.shape) ? raw.shape : DEFAULT_CONTRIBUTION_MARKER.shape,
  };
}

function isTheme(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function isLanguage(value: unknown): value is LanguagePreference {
  return value === "zh-CN" || value === "en-US";
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
    contributionMarker: normalizeContributionMarker(raw?.contributionMarker),
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
