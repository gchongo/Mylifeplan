"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { ColorSwatchField } from "@/components/forms/color-swatch-field";
import { DEFAULT_PLAN_COLOR } from "@/lib/plan-color";

export function PlanColorSwatchField({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <ColorSwatchField
      label={t("forms.planColor")}
      value={value}
      allowClear={false}
      onChange={(color) => onChange(color ?? DEFAULT_PLAN_COLOR)}
      disabled={disabled}
    />
  );
}
