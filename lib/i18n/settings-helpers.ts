import { createTranslator, type TranslationKey } from "@/lib/i18n/translate";

type TranslateFn = ReturnType<typeof createTranslator>;

export function localizeWeekNumberModeLabel(t: TranslateFn, value: string): string {
  return t(`settings.weekNumberMode.${value}` as TranslationKey);
}

export function localizeWeekNumberFormatLabel(t: TranslateFn, value: string): string {
  return t(`settings.weekNumberFormat.${value}` as TranslationKey);
}

export function localizeGanttTodayFillLabel(t: TranslateFn, value: string): string {
  return t(`settings.ganttTodayFill.${value}` as TranslationKey);
}

export function localizeGanttActualWidthLabel(t: TranslateFn, value: number): string {
  return t(`settings.ganttActualWidth.${value}` as TranslationKey);
}

export function localizeGanttActualStyleLabel(t: TranslateFn, value: string): string {
  return t(`settings.ganttActualStyle.${value}` as TranslationKey);
}

export function localizeSettingsWeekdayMonStart(t: TranslateFn, index: number): string {
  return t(`settings.weekNumber.weekdayMonStart.${index}` as TranslationKey);
}

export function localizeGanttTodayWeekday(t: TranslateFn, index: number): string {
  return t(`settings.ganttTodaySettings.weekdayMonStart.${index}` as TranslationKey);
}
