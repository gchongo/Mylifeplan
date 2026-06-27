"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import type { GanttPlanBarPreferences } from "@/lib/user-preferences";

export function GanttPlanBarSettings({
  value,
  onChange,
  disabled = false,
}: {
  value: GanttPlanBarPreferences;
  onChange: (patch: Partial<GanttPlanBarPreferences>) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  return (
    <label className="block text-sm">
      <span className="mb-1 flex items-center justify-between font-medium text-gray-700 dark:text-gray-300">
        <span>{t("settings.ganttPlanBarSettings.opacity")}</span>
        <span className="text-xs font-normal text-gray-500">{value.opacity}%</span>
      </span>
      <input
        type="range"
        min={20}
        max={100}
        step={1}
        value={value.opacity}
        disabled={disabled}
        onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        className="w-full accent-brand-600"
      />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {t("settings.ganttPlanBarSettings.hint")}
      </p>
    </label>
  );
}
