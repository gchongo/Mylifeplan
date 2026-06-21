"use client";

import { ColorSwatchField } from "@/components/forms/color-swatch-field";

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
    <ColorSwatchField
      label="甘特标记色"
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
