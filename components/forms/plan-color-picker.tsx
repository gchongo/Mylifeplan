"use client";

import { useState } from "react";
import {
  DEFAULT_PLAN_COLOR,
  normalizePlanColor,
  PLAN_COLOR_SWATCHES,
} from "@/lib/plan-color";
import { cn } from "@/lib/utils";

export function PlanColorPicker({
  name = "color",
  defaultValue,
}: {
  name?: string;
  defaultValue?: string | null;
}) {
  const initial = normalizePlanColor(defaultValue ?? DEFAULT_PLAN_COLOR);
  const [value, setValue] = useState(initial);

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        计划颜色
      </span>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2">
        {PLAN_COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`颜色 ${swatch}`}
            onClick={() => setValue(swatch)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
              value === swatch ? "border-gray-900 ring-2 ring-gray-400 dark:border-white dark:ring-gray-500" : "border-transparent",
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        甘特图条颜色；状态请用标题旁圆点切换
      </p>
    </div>
  );
}
