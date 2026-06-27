"use client";

import { Fragment } from "react";
import { GanttScheduleEditableCell } from "@/components/gantt/gantt-schedule-editable-cell";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  GANTT_SCHEDULE_COLUMN_IDS,
  getMobileScheduleCellValue,
  getScheduleEditRawValue,
  isScheduleCellEditable,
  isScheduleColumnEditable,
  type GanttScheduleColumnId,
} from "@/lib/gantt-schedule-columns";
import { localizedScheduleColumnDefs, localizeScheduleReadOnlyTitle } from "@/lib/i18n/gantt-helpers";
import { mobilePlanColumnWidth, MOBILE_PLAN_GROUP_GAP_CLASS } from "@/lib/gantt-mobile-layout";
import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";
import { cn } from "@/lib/utils";
import type { GanttItem } from "@/types";

const METRIC_ROW_HEIGHT = 24;

type MobileGanttRow = {
  item: GanttItem;
  depth: number;
  gapBefore: number;
};

export function GanttMobileScheduleDrawer({
  rows,
  allPlans,
  scrollLeft,
  timeAxisWidth,
  gridWidth,
  onPlanFieldUpdated,
  className,
}: {
  rows: MobileGanttRow[];
  allPlans: GanttItem[];
  scrollLeft: number;
  timeAxisWidth: number;
  gridWidth: number;
  onPlanFieldUpdated?: (plan?: SerializedPlanForGantt) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const metricIds: GanttScheduleColumnId[] = [...GANTT_SCHEDULE_COLUMN_IDS];
  const columnDefs = localizedScheduleColumnDefs(t, [...GANTT_SCHEDULE_COLUMN_IDS]);
  const defById = new Map(columnDefs.map((d) => [d.id, d]));
  const drawerHeight = metricIds.length * METRIC_ROW_HEIGHT;

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden border-b border-blue-200/80 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/40",
        className,
      )}
    >
      <div className="flex" style={{ height: drawerHeight }}>
        <div
          className="shrink-0 border-r border-blue-200/80 dark:border-blue-900/50"
          style={{ width: timeAxisWidth }}
        >
          {metricIds.map((id) => {
            const def = defById.get(id);
            return (
              <div
                key={id}
                className="flex items-center justify-end border-b border-blue-100/90 px-1 text-[9px] font-medium text-gray-500 last:border-b-0 dark:border-blue-900/45 dark:text-gray-400"
                style={{ height: METRIC_ROW_HEIGHT }}
                title={def?.label}
              >
                {def?.shortLabel ?? id}
              </div>
            );
          })}
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            className="flex will-change-transform"
            style={{ width: gridWidth, transform: `translateX(-${scrollLeft}px)` }}
          >
            {rows.map((row) => (
              <Fragment key={row.item.id}>
                {row.gapBefore > 0 ? (
                  <div
                    className={MOBILE_PLAN_GROUP_GAP_CLASS}
                    style={{ width: row.gapBefore }}
                  />
                ) : null}
                <div
                  className="shrink-0 border-r border-blue-100/90 dark:border-blue-900/45"
                  style={{ width: mobilePlanColumnWidth(row.depth) }}
                >
                  {metricIds.map((id) => {
                    const cell = getMobileScheduleCellValue(id, row.item, allPlans);
                    const editable =
                      Boolean(onPlanFieldUpdated) &&
                      isScheduleCellEditable(id, row.item, allPlans) &&
                      isScheduleColumnEditable(id);
                    const readOnlyTitle = localizeScheduleReadOnlyTitle(t, {
                      rollupActuals:
                        (id === "actualStart" || id === "actualEnd") &&
                        !editable &&
                        !row.item.contributionOnly,
                      virtual: Boolean(cell.virtual),
                      cellText: cell.text,
                    });

                    if (editable) {
                      return (
                        <div key={id} style={{ height: METRIC_ROW_HEIGHT }}>
                          <GanttScheduleEditableCell
                            variant="mobile"
                            trigger="click"
                            columnId={id}
                            planId={row.item.id}
                            rawValue={getScheduleEditRawValue(id, row.item)}
                            cell={cell}
                            width={mobilePlanColumnWidth(row.depth)}
                            onSaved={onPlanFieldUpdated!}
                          />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={id}
                        className={cn(
                          "flex items-center justify-center border-b border-blue-100/90 px-0.5 text-center text-[9px] tabular-nums leading-none text-gray-700 last:border-b-0 dark:border-blue-900/45 dark:text-gray-200",
                          cell.muted && "text-gray-400 dark:text-gray-500",
                        )}
                        style={{ height: METRIC_ROW_HEIGHT }}
                        title={readOnlyTitle}
                      >
                        <span className="whitespace-nowrap">{cell.text}</span>
                      </div>
                    );
                  })}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
