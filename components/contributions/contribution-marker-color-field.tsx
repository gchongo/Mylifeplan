"use client";

import { PLAN_COLOR_SWATCHES } from "@/lib/plan-color";
import { cn } from "@/lib/utils";

export function ContributionMarkerColorField({
  value,
  onChange,
  disabled = false,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">甘特标记色</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">默认继承所属计划组颜色，也可自定义</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors",
            value === null
              ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300"
              : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
          )}
        >
          继承计划色
        </button>
        {PLAN_COLOR_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            disabled={disabled}
            title={color}
            aria-label={`标记色 ${color}`}
            onClick={() => onChange(color)}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
              value === color ? "border-gray-900 dark:border-white" : "border-transparent",
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}
