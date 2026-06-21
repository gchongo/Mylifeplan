"use client";

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
  return (
    <ColorSwatchField
      label="计划颜色"
      value={value}
      allowClear={false}
      onChange={(color) => onChange(color ?? DEFAULT_PLAN_COLOR)}
      disabled={disabled}
    />
  );
}
