import type { GanttScaleId } from "@/lib/gantt-scale";
import {
  GANTT_SCHEDULE_COLUMNS,
  GANTT_SCHEDULE_UNIFORM_COL_WIDTH,
  type GanttScheduleColumnDef,
  type GanttScheduleColumnId,
} from "@/lib/gantt-schedule-columns";
import type { VisualStatusKey } from "@/lib/task-status-style";
import { createTranslator, type TranslationKey } from "@/lib/i18n/translate";

type TranslateFn = ReturnType<typeof createTranslator>;

const VISUAL_STATUS_KEYS: Record<VisualStatusKey, TranslationKey> = {
  todo: "gantt.visualStatus.todo",
  in_progress: "gantt.visualStatus.in_progress",
  done: "gantt.visualStatus.done",
  archived: "gantt.visualStatus.archived",
  overdue: "gantt.visualStatus.overdue",
  unscheduled: "gantt.visualStatus.unscheduled",
};

export function localizeGanttScaleLabel(t: TranslateFn, id: GanttScaleId): string {
  return t(`gantt.scale.${id}` as TranslationKey);
}

export function localizeVisualStatusLabel(t: TranslateFn, key: VisualStatusKey): string {
  return t(VISUAL_STATUS_KEYS[key]);
}

export function localizeScheduleColumnLabel(t: TranslateFn, id: GanttScheduleColumnId): string {
  return t(`gantt.column.${id}.label` as TranslationKey);
}

export function localizeScheduleColumnShortLabel(t: TranslateFn, id: GanttScheduleColumnId): string {
  return t(`gantt.column.${id}.short` as TranslationKey);
}

export function localizedScheduleColumnDefs(
  t: TranslateFn,
  ids: GanttScheduleColumnId[],
): GanttScheduleColumnDef[] {
  return ids
    .map((id) => {
      const base = GANTT_SCHEDULE_COLUMNS.find((c) => c.id === id);
      if (!base) return null;
      return {
        id,
        label: localizeScheduleColumnLabel(t, id),
        shortLabel: localizeScheduleColumnShortLabel(t, id),
        width: GANTT_SCHEDULE_UNIFORM_COL_WIDTH,
      };
    })
    .filter(Boolean) as GanttScheduleColumnDef[];
}

export function localizeScheduleColumnTitle(
  t: TranslateFn,
  columnId: GanttScheduleColumnId,
): string {
  return localizeScheduleColumnLabel(t, columnId);
}

export function localizeScheduleReadOnlyTitle(
  t: TranslateFn,
  options: { rollupActuals: boolean; virtual: boolean; cellText: string },
): string | undefined {
  if (options.rollupActuals) {
    return t("gantt.schedule.rollupActuals");
  }
  if (options.virtual) {
    return t("gantt.schedule.virtualDeadline", { date: options.cellText });
  }
  return undefined;
}

export function localizeScheduleEditableLabel(
  t: TranslateFn,
  options: { empty: boolean; cellText: string; virtual: boolean },
): { label: string; cellTitle: string } {
  const label = options.empty
    ? t("gantt.schedule.doubleClickSet")
    : t("gantt.schedule.doubleClickEdit", { value: options.cellText });
  const cellTitle = options.virtual
    ? t("gantt.schedule.virtualDeadlineEdit", { date: options.cellText })
    : label;
  return { label, cellTitle };
}
