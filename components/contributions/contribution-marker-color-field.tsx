"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
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
  const { t } = useI18n();
  return (
    <ColorSwatchField
      label={t("forms.markerColor")}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
