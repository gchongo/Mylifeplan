"use client";

import {
  GANTT_TODAY_COLUMN_COLORS,
  GANTT_TODAY_COLUMN_FILL_OPTIONS,
  type GanttTodayColumnPreferences,
} from "@/lib/user-preferences";
import { ganttTodayColumnBackground } from "@/lib/gantt-today-column-style";
import { cn } from "@/lib/utils";

export function GanttTodayColumnSettings({
  value,
  onChange,
  disabled = false,
}: {
  value: GanttTodayColumnPreferences;
  onChange: (patch: Partial<GanttTodayColumnPreferences>) => void;
  disabled?: boolean;
}) {
  const previewStyle = ganttTodayColumnBackground(value);

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-gray-700 dark:text-gray-300">高亮今天所在列</span>
        <input
          type="checkbox"
          checked={value.enabled}
          disabled={disabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
      </label>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">填充颜色</p>
        <div className="flex flex-wrap gap-2">
          {GANTT_TODAY_COLUMN_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              disabled={disabled}
              aria-label={`填充颜色 ${color}`}
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
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">填充形式</span>
          <select
            value={value.fillStyle}
            disabled={disabled}
            onChange={(e) =>
              onChange({ fillStyle: e.target.value as GanttTodayColumnPreferences["fillStyle"] })
            }
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {GANTT_TODAY_COLUMN_FILL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 flex items-center justify-between font-medium text-gray-700 dark:text-gray-300">
            <span>透明度</span>
            <span className="text-xs font-normal text-gray-500">{value.opacity}%</span>
          </span>
          <input
            type="range"
            min={5}
            max={80}
            step={1}
            value={value.opacity}
            disabled={disabled}
            onChange={(e) => onChange({ opacity: Number(e.target.value) })}
            className="w-full accent-brand-600"
          />
        </label>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">预览</p>
        <div className="flex h-10 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
          {["一", "二", "三", "四", "五"].map((label, i) => (
            <div
              key={label}
              className={cn(
                "flex flex-1 items-center justify-center border-r border-gray-200 text-xs text-gray-600 last:border-r-0 dark:border-gray-700 dark:text-gray-300",
                i !== 2 && "bg-white dark:bg-gray-950",
              )}
              style={i === 2 ? previewStyle : undefined}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
