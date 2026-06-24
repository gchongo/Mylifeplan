"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
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
  const { t } = useI18n();
  const initial = normalizePlanColor(defaultValue ?? DEFAULT_PLAN_COLOR);
  const [value, setValue] = useState(initial);

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t("forms.planColor")}
      </span>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2">
        {PLAN_COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={t("forms.colorAria", { color: swatch })}
            onClick={() => setValue(swatch)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
              value === swatch ? "border-gray-900 ring-2 ring-gray-400 dark:border-white dark:ring-gray-500" : "border-transparent",
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t("forms.colorHint")}</p>
    </div>
  );
}
