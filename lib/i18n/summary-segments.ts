"use client";

import type { SummarySegment } from "@/components/summary/summary-widgets";
import type { TranslationKey } from "@/lib/i18n/translate";

export function localizeSummarySegments(
  segments: SummarySegment[],
  group: "status" | "type" | "executionLabel",
  t: (key: TranslationKey) => string,
): SummarySegment[] {
  return segments.map((seg) => ({
    ...seg,
    label: seg.key ? t(`summary.${group}.${seg.key}` as TranslationKey) : seg.label,
  }));
}
