"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import {
  GANTT_ACTUAL_LINE_COLORS,
  GANTT_ACTUAL_LINE_STYLE_OPTIONS,
  GANTT_ACTUAL_LINE_WIDTH_OPTIONS,
  type GanttActualLinePreferences,
} from "@/lib/user-preferences";
import { GanttActualExecutionLine } from "@/components/gantt/gantt-actual-execution-line";
import {
  localizeGanttActualStyleLabel,
  localizeGanttActualWidthLabel,
} from "@/lib/i18n/settings-helpers";
import { cn } from "@/lib/utils";

export function GanttActualLineSettings({
  value,
  onChange,
  disabled = false,
}: {
  value: GanttActualLinePreferences;
  onChange: (patch: Partial<GanttActualLinePreferences>) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-gray-700 dark:text-gray-300">
          {t("settings.ganttActualSettings.showLine")}
        </span>
        <input
          type="checkbox"
          checked={value.enabled}
          disabled={disabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
      </label>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("settings.ganttActualSettings.lineColor")}
        </p>
        <div className="flex flex-wrap gap-2">
          {GANTT_ACTUAL_LINE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              disabled={disabled}
              aria-label={t("settings.ganttActualSettings.lineColorAria", { color })}
              aria-pressed={value.color === color}
              onClick={() => onChange({ color })}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                value.color === color ? "border-gray-900 dark:border-white" : "border-transparent",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
            {t("settings.ganttActualSettings.width")}
          </span>
          <select
            value={value.width}
            disabled={disabled}
            onChange={(e) => onChange({ width: Number(e.target.value) as 1 | 2 | 3 })}
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {GANTT_ACTUAL_LINE_WIDTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {localizeGanttActualWidthLabel(t, opt.value)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
            {t("settings.ganttActualSettings.lineStyle")}
          </span>
          <select
            value={value.style}
            disabled={disabled}
            onChange={(e) =>
              onChange({ style: e.target.value as GanttActualLinePreferences["style"] })
            }
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {GANTT_ACTUAL_LINE_STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {localizeGanttActualStyleLabel(t, opt.value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          {t("settings.ganttActualSettings.preview")}
        </p>
        <div className="relative h-8 rounded-full bg-indigo-100/80 dark:bg-indigo-950/40">
          <GanttActualExecutionLine
            left={12}
            width={Math.max(120, 0)}
            top={0}
            height={32}
            prefs={value}
          />
        </div>
      </div>
    </div>
  );
}
