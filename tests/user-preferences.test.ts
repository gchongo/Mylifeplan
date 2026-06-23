import { describe, expect, it } from "vitest";
import {
  DEFAULT_CALENDAR_WEEK_NUMBERS,
  DEFAULT_GANTT_TODAY_COLUMN,
  DEFAULT_USER_PREFERENCES,
  normalizeCalendarWeekNumberPreferences,
  normalizeGanttTodayColumnPreferences,
  normalizeUserPreferences,
  resolveTimezone,
} from "@/lib/user-preferences";

describe("user preferences", () => {
  it("falls back to defaults for invalid values", () => {
    expect(
      normalizeUserPreferences({
        timezone: "",
        theme: "neon",
        language: "fr",
      }),
    ).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it("resolves auto timezone from Intl", () => {
    const tz = resolveTimezone("auto");
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });

  it("ignores legacy contribution marker fields in stored prefs", () => {
    expect(
      normalizeUserPreferences({
        timezone: "UTC",
        contributionMarker: { color: "#FF0000", size: "md", shape: "square" },
      } as never),
    ).toEqual({
      timezone: "UTC",
      theme: DEFAULT_USER_PREFERENCES.theme,
      language: DEFAULT_USER_PREFERENCES.language,
      ganttActualLine: DEFAULT_USER_PREFERENCES.ganttActualLine,
      ganttContributionMarkers: DEFAULT_USER_PREFERENCES.ganttContributionMarkers,
      ganttTodayColumn: DEFAULT_USER_PREFERENCES.ganttTodayColumn,
      calendarWeekNumbers: DEFAULT_USER_PREFERENCES.calendarWeekNumbers,
    });
  });

  it("normalizes calendar week number prefs", () => {
    expect(
      normalizeCalendarWeekNumberPreferences({
        enabled: false,
        mode: "invalid",
        format: "invalid",
      } as never),
    ).toEqual({
      ...DEFAULT_CALENDAR_WEEK_NUMBERS,
      enabled: false,
    });
  });

  it("normalizes today column opacity bounds", () => {
    expect(
      normalizeGanttTodayColumnPreferences({
        opacity: 200,
        fillStyle: "striped",
      }),
    ).toEqual({
      ...DEFAULT_GANTT_TODAY_COLUMN,
      opacity: 80,
      fillStyle: "striped",
    });
  });
});
