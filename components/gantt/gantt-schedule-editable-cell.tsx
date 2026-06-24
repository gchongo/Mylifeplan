"use client";

import {
  scheduleColumnPlanField,
  type GanttScheduleEditableColumnId,
} from "@/lib/gantt-schedule-columns";
import { datetimeLocalToIso, toDatetimeLocalInput } from "@/lib/dates";
import { PlanDateTimeField } from "@/components/forms/plan-datetime-field";
import { cn } from "@/lib/utils";
import type { ScheduleCellValue } from "@/lib/gantt-schedule-columns";

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
}: {
  columnId: GanttScheduleEditableColumnId;
  planId: string;
  rawValue: string | null;
  cell: ScheduleCellValue;
  width: number;
  onSaved: () => void;
}) {
  const edge = scheduleFieldEdge(scheduleColumnPlanField(columnId));
  const columnTitle =
    columnId === "planStart"
      ? "计划开始"
      : columnId === "planEnd"
        ? "计划结束"
        : columnId === "actualStart"
          ? "实际开始"
          : "实际结束";

  const label =
    cell.text === "—" ? "双击设置时间" : `双击修改：${cell.text}`;

  const localValue = rawValue?.trim() ? toDatetimeLocalInput(rawValue) : "";

  return (
    <PlanDateTimeField
      value={localValue}
      edge={edge}
      trigger="doubleClick"
      size="cell"
      panelTitle={columnTitle}
      cellDisplay={cell.text}
      cellTitle={cell.virtual ? `${cell.text}（预估截止，双击设置正式截止）` : label}
      cellAriaLabel={label}
      triggerClassName={cn(
        "relative flex h-full w-full shrink-0 items-center justify-center border-l border-blue-100/80 px-0.5 text-center text-[10px] tabular-nums leading-tight transition-colors dark:border-blue-900/35",
        "cursor-pointer hover:bg-blue-100/70 dark:hover:bg-blue-900/35",
        cell.muted && "text-gray-400",
        cell.virtual && "italic text-gray-500",
        cell.highlight && "bg-amber-50 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
        !cell.muted && !cell.virtual && !cell.highlight && "text-gray-600 dark:text-gray-300",
      )}
      style={{ width }}
      onConfirm={async (draft) => {
        const field = scheduleColumnPlanField(columnId);
        const nextIso = draft.trim() ? datetimeLocalToIso(draft) : null;
        const prevIso = rawValue?.trim() ? datetimeLocalToIso(toDatetimeLocalInput(rawValue)) : null;
        if (nextIso === prevIso || (!nextIso && !prevIso)) return;

        try {
          const res = await fetch(`/api/plans/${planId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: nextIso }),
          });
          const data = (await res.json()) as { error?: string };
          if (!res.ok) return data.error ?? "保存失败";
          onSaved();
        } catch {
          return "网络错误";
        }
      }}
    />
  );
}
