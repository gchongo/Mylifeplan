"use client";

import {
  scheduleColumnPlanField,
  type GanttScheduleEditableColumnId,
  type ScheduleCellValue,
} from "@/lib/gantt-schedule-columns";
import { datetimeLocalToIso, toDatetimeLocalInput } from "@/lib/dates";
import { PlanDateTimeField } from "@/components/forms/plan-datetime-field";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  localizeScheduleColumnTitle,
  localizeScheduleEditableLabel,
} from "@/lib/i18n/gantt-helpers";
import { cn } from "@/lib/utils";
import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";

function scheduleFieldEdge(
  field: ReturnType<typeof scheduleColumnPlanField>,
): "start" | "end" {
  return field === "endDate" || field === "actualEndDate" ? "end" : "start";
}

export function GanttScheduleEditableCell({
  columnId,
  planId,
  rawValue,
  cell,
  width,
  onSaved,
  trigger,
  variant = "panel",
}: {
  columnId: GanttScheduleEditableColumnId;
  planId: string;
  rawValue: string | null;
  cell: ScheduleCellValue;
  width: number;
  onSaved: (plan?: SerializedPlanForGantt) => void;
  trigger?: "click" | "doubleClick";
  variant?: "panel" | "mobile";
}) {
  const { t } = useI18n();
  const edge = scheduleFieldEdge(scheduleColumnPlanField(columnId));
  const columnTitle = localizeScheduleColumnTitle(t, columnId);
  const empty = cell.text === "—";
  const { label, cellTitle } = localizeScheduleEditableLabel(t, {
    empty,
    cellText: cell.text,
    virtual: Boolean(cell.virtual),
  });

  const localValue = rawValue?.trim() ? toDatetimeLocalInput(rawValue) : "";
  const isMobile = variant === "mobile";
  const openTrigger = trigger ?? (isMobile ? "click" : "doubleClick");

  return (
    <PlanDateTimeField
      value={localValue}
      edge={edge}
      trigger={openTrigger}
      size="cell"
      panelTitle={columnTitle}
      cellDisplay={<span className="whitespace-nowrap">{cell.text}</span>}
      cellTitle={cellTitle}
      cellAriaLabel={label}
      triggerClassName={cn(
        "relative flex h-full w-full shrink-0 items-center justify-center px-0.5 text-center tabular-nums leading-none transition-colors",
        isMobile
          ? "border-b border-blue-100/90 hover:bg-blue-100/70 dark:border-blue-900/45 dark:hover:bg-blue-900/35"
          : "border-l border-blue-100/80 text-[10px] leading-tight hover:bg-blue-100/70 dark:border-blue-900/35 dark:hover:bg-blue-900/35",
        "cursor-pointer",
        cell.muted && "text-gray-400 dark:text-gray-500",
        cell.virtual && "italic text-gray-500",
        cell.highlight && "bg-amber-50 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
        !cell.muted &&
          !cell.virtual &&
          !cell.highlight &&
          (isMobile ? "text-gray-700 dark:text-gray-200" : "text-gray-600 dark:text-gray-300"),
        isMobile && "text-[9px]",
      )}
      style={isMobile ? undefined : { width }}
      onConfirm={async (draft) => {
        const field = scheduleColumnPlanField(columnId);
        const nextIso = draft.trim() ? datetimeLocalToIso(draft) : null;
        const prevIso = rawValue?.trim() ? datetimeLocalToIso(toDatetimeLocalInput(rawValue)) : null;
        if (nextIso === prevIso || (!nextIso && !prevIso)) return;

        try {
          const res = await fetch(`/api/plans/${planId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ [field]: nextIso }),
          });
          const data = (await res.json()) as { error?: string; plan?: SerializedPlanForGantt };
          if (!res.ok) return data.error ?? t("gantt.contributionDrawer.saveFailed");
          onSaved(data.plan);
        } catch {
          return t("gantt.contributionDrawer.networkError");
        }
      }}
    />
  );
}
