import type { CalendarDisplayMode, CalendarViewMode } from "@/lib/calendar-display";
import type { LanguagePreference } from "@/lib/user-preferences";
import { createTranslator, type TranslationKey } from "@/lib/i18n/translate";

type TranslateFn = ReturnType<typeof createTranslator>;

export function localizeCalendarViewLabel(t: TranslateFn, id: CalendarViewMode): string {
  return t(`calendar.view.${id}` as TranslationKey);
}

export function localizeCalendarDisplayLabel(t: TranslateFn, id: CalendarDisplayMode): string {
  return t(`calendar.display.${id}` as TranslationKey);
}

export function localizeCalendarDisplayHint(t: TranslateFn, id: CalendarDisplayMode): string {
  return t(`calendar.display.${id}Hint` as TranslationKey);
}

export function localizeCalendarMonthLabel(
  t: TranslateFn,
  locale: LanguagePreference,
  monthIndex: number,
): string {
  const key = locale === "en-US" ? "calendar.monthLabelsEn" : "calendar.monthLabels";
  return t(`${key}.${monthIndex}` as TranslationKey);
}

export function formatCalendarDayDrawerTitle(
  dateStr: string,
  count: number,
  locale: LanguagePreference,
  t: TranslateFn,
): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (locale === "en-US") {
    return t("calendar.dayDrawerTitleEn", { month: m, day: d, year: y, count });
  }
  return t("calendar.dayDrawerTitle", { year: y, month: m, day: d, count });
}

export function formatCalendarYearLabel(
  year: number,
  locale: LanguagePreference,
  t: TranslateFn,
): string {
  if (locale === "en-US") return String(year);
  return `${year}${t("common.yearSuffix")}`;
}
