"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import {
  CALENDAR_WEEK_NUMBER_FORMAT_OPTIONS,
  CALENDAR_WEEK_NUMBER_MODE_OPTIONS,
  type CalendarWeekNumberPreferences,
} from "@/lib/user-preferences";
import { formatCalendarWeekNumber } from "@/lib/calendar-week-number";
import {
  localizeSettingsWeekdayMonStart,
  localizeWeekNumberFormatLabel,
  localizeWeekNumberModeLabel,
} from "@/lib/i18n/settings-helpers";
import { cn } from "@/lib/utils";

const PREVIEW_YEAR = 2025;
const PREVIEW_MONTH = 5;

export function CalendarWeekNumberSettings({
  value,
  onChange,
  disabled = false,
}: {
  value: CalendarWeekNumberPreferences;
  onChange: (patch: Partial<CalendarWeekNumberPreferences>) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const previewWeeks = [
    formatCalendarWeekNumber(value, PREVIEW_YEAR, PREVIEW_MONTH, [null, null, 1, 2, 3, 4, 5], 0, 5),
    formatCalendarWeekNumber(value, PREVIEW_YEAR, PREVIEW_MONTH, [6, 7, 8, 9, 10, 11, 12], 1, 5),
    formatCalendarWeekNumber(value, PREVIEW_YEAR, PREVIEW_MONTH, [13, 14, 15, 16, 17, 18, 19], 2, 5),
  ];
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => localizeSettingsWeekdayMonStart(t, i));

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-gray-700 dark:text-gray-300">{t("settings.weekNumber.showLabel")}</span>
        <input
          type="checkbox"
          checked={value.enabled}
          disabled={disabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
      </label>

      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          !value.enabled && "pointer-events-none opacity-50",
        )}
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
            {t("settings.weekNumber.modeLabel")}
          </span>
          <select
            value={value.mode}
            disabled={disabled || !value.enabled}
            onChange={(e) =>
              onChange({ mode: e.target.value as CalendarWeekNumberPreferences["mode"] })
            }
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {CALENDAR_WEEK_NUMBER_MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {localizeWeekNumberModeLabel(t, opt.value)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
            {t("settings.weekNumber.formatLabel")}
          </span>
          <select
            value={value.format}
            disabled={disabled || !value.enabled}
            onChange={(e) =>
              onChange({ format: e.target.value as CalendarWeekNumberPreferences["format"] })
            }
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {CALENDAR_WEEK_NUMBER_FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {localizeWeekNumberFormatLabel(t, opt.value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t("settings.weekNumber.preview")}</p>
        <div
          className={cn(
            "overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950",
            value.format === "week-label" ? "grid-cols-[2.75rem_1fr]" : "grid-cols-[1.75rem_1fr]",
            value.enabled ? "grid" : "opacity-40",
          )}
        >
          <div className="border-b border-r border-gray-200 py-1 text-center text-[10px] text-gray-500 dark:border-gray-700">
            {t("settings.weekNumber.weekHeader")}
          </div>
          <div className="grid grid-cols-7 border-b border-gray-200 text-center text-[10px] text-gray-500 dark:border-gray-700">
            {weekdayLabels.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>
          {previewWeeks.map((label, row) => (
            <div key={row} className="contents">
              <div className="flex items-center justify-center border-r border-gray-200 py-2 text-[10px] font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
                {value.enabled ? label : "—"}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: 7 }, (_, col) => (
                  <div
                    key={col}
                    className="flex h-7 items-center justify-center border-b border-r border-gray-100 text-[10px] text-gray-400 last:border-r-0 dark:border-gray-800"
                  >
                    {row === 0 && col >= 2 ? col - 1 : row === 1 ? col + 5 : col + 12}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
