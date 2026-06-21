"use client";

import { PLAN_COLOR_SWATCHES } from "@/lib/plan-color";
import { cn } from "@/lib/utils";

export function ColorSwatchField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string | null;
  onChange: (color: string | null) => void;
  disabled?: boolean;
  /** 再次点击已选色时是否清除为 null */
  allowClear?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {PLAN_COLOR_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            disabled={disabled}
            title={color}
            aria-label={`${label} ${color}`}
            aria-pressed={value === color}
            onClick={() =>
              onChange(allowClear !== false && value === color ? null : color)
            }
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
