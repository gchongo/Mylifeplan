import type { HeaderSpan } from "@/lib/gantt-scale";
import type { LanguagePreference } from "@/lib/user-preferences";
import { createTranslator, type TranslationKey } from "@/lib/i18n/translate";

type TranslateFn = ReturnType<typeof createTranslator>;

const PERIOD_ZH = ["凌晨", "上午", "下午", "夜晚"] as const;
const PERIOD_KEYS = ["dawn", "am", "pm", "night"] as const;

const WEEKDAY_ZH = ["日", "一", "二", "三", "四", "五", "六"] as const;

const ZODIAC_ZH = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"] as const;

function periodGroup(locale: LanguagePreference): "period" | "periodEn" {
  return locale === "en-US" ? "periodEn" : "period";
}

export function localizeHourPeriod(
  t: TranslateFn,
  locale: LanguagePreference,
  label: string,
): string {
  const idx = PERIOD_ZH.indexOf(label as (typeof PERIOD_ZH)[number]);
  if (idx >= 0) {
    return t(`timeline.${periodGroup(locale)}.${PERIOD_KEYS[idx]}` as TranslationKey);
  }
  return label;
}

export function localizeWeekdayShort(
  t: TranslateFn,
  locale: LanguagePreference,
  label: string,
): string {
  const idx = WEEKDAY_ZH.indexOf(label as (typeof WEEKDAY_ZH)[number]);
  if (idx >= 0) {
    const group = locale === "en-US" ? "timeline.weekdayShortEn" : "timeline.weekdayShort";
    return t(`${group}.${idx}` as TranslationKey);
  }
  return label;
}

export function localizeWeekNumberLabel(
  t: TranslateFn,
  locale: LanguagePreference,
  label: string,
): string {
  const match = label.match(/^第(\d+)周$/);
  if (match) {
    const key = locale === "en-US" ? "timeline.weekLabelEn" : "timeline.weekLabel";
    return t(key, { week: match[1]! });
  }
  return label;
}

export function localizeZodiacYear(
  t: TranslateFn,
  locale: LanguagePreference,
  label: string,
): string {
  const match = label.match(/^(.+)年$/);
  if (!match) return label;
  const idx = ZODIAC_ZH.indexOf(match[1] as (typeof ZODIAC_ZH)[number]);
  if (idx < 0) return label;
  if (locale === "en-US") {
    const animal = t(`timeline.zodiacEn.${idx}` as TranslationKey);
    return t("timeline.zodiacYearEn", { animal });
  }
  return label;
}

export function localizeYearMonthGroup(
  t: TranslateFn,
  locale: LanguagePreference,
  label: string,
): string {
  const match = label.match(/^(\d{4})年(\d{1,2})月$/);
  if (!match) return label;
  if (locale === "en-US") {
    return t("timeline.yearMonthEn", { year: match[1]!, month: match[2]! });
  }
  return label;
}

export function localizeTimelineSubheaderSpans(
  spans: HeaderSpan[],
  locale: LanguagePreference,
  t: TranslateFn,
): HeaderSpan[] {
  return spans.map((span) => ({
    ...span,
    label:
      localizeZodiacYear(t, locale, span.label) !== span.label
        ? localizeZodiacYear(t, locale, span.label)
        : localizeWeekNumberLabel(t, locale, span.label) !== span.label
          ? localizeWeekNumberLabel(t, locale, span.label)
          : localizeWeekdayShort(t, locale, span.label) !== span.label
            ? localizeWeekdayShort(t, locale, span.label)
            : localizeHourPeriod(t, locale, span.label),
  }));
}

export function localizeTimelineTopGroupLabel(
  t: TranslateFn,
  locale: LanguagePreference,
  label: string,
): string {
  const ym = localizeYearMonthGroup(t, locale, label);
  if (ym !== label) return ym;
  const dayMatch = label.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (dayMatch && locale === "en-US") {
    return t("timeline.yearMonthDayEn", { month: dayMatch[1]!, day: dayMatch[2]! });
  }
  return label;
}

export function localizeTimelinePeriodLabel(
  t: TranslateFn,
  locale: LanguagePreference,
  label: string,
): string {
  const dayMatch = label.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (dayMatch) {
    if (locale === "en-US") {
      return t("calendar.dayDrawerTitleEn", {
        year: dayMatch[1]!,
        month: dayMatch[2]!,
        day: dayMatch[3]!,
        count: 0,
      }).replace(" · 0 items", "");
    }
    return label;
  }
  const ymMatch = label.match(/^(\d{4})年(\d{1,2})月$/);
  if (ymMatch) {
    return localizeYearMonthGroup(t, locale, label);
  }
  const yMatch = label.match(/^(\d{4})年$/);
  if (yMatch && locale === "en-US") return yMatch[1]!;
  const rangeMatch = label.match(/^(\d{4})–(\d{4})年$/);
  if (rangeMatch && locale === "en-US") {
    return t("timeline.yearRangeEn", { start: rangeMatch[1]!, end: rangeMatch[2]! });
  }
  return label;
}
