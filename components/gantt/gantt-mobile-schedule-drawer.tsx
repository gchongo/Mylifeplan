"use client";

import { Fragment } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  GANTT_SCHEDULE_COLUMN_IDS,
  getMobileScheduleCellValue,
  isScheduleCellEditable,
  type GanttScheduleColumnId,
} from "@/lib/gantt-schedule-columns";
import { localizedScheduleColumnDefs, localizeScheduleReadOnlyTitle } from "@/lib/i18n/gantt-helpers";
import {
  mobilePlanColumnWidth,
  MOBILE_PLAN_COLUMN_BORDER_CLASS,
  MOBILE_PLAN_GROUP_GAP_CLASS,
} from "@/lib/gantt-mobile-layout";
import { cn } from "@/lib/utils";
import type { GanttItem } from "@/types";

const METRIC_ROW_HEIGHT = 24;

const DRAWER_BORDER_CLASS = "border-blue-200 dark:border-blue-800/80";
const DRAWER_ROW_BORDER_CLASS = "border-blue-200/90 dark:border-blue-800/70";

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
  className,
}: {
  rows: MobileGanttRow[];
  allPlans: GanttItem[];
  scrollLeft: number;
  timeAxisWidth: number;
  gridWidth: number;
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
        "shrink-0 overflow-hidden border-b bg-blue-50/80 dark:bg-blue-950/40",
        DRAWER_BORDER_CLASS,
        className,
      )}
    >
      <div className="flex" style={{ height: drawerHeight }}>
        <div
          className={cn("shrink-0 border-r", DRAWER_BORDER_CLASS)}
          style={{ width: timeAxisWidth }}
        >
          {metricIds.map((id) => {
            const def = defById.get(id);
            return (
              <div
                key={id}
                className={cn(
                  "flex items-center justify-end border-b px-1 text-[9px] font-medium text-gray-500 last:border-b-0 dark:text-gray-400",
                  DRAWER_ROW_BORDER_CLASS,
                )}
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
                  className={cn("shrink-0", MOBILE_PLAN_COLUMN_BORDER_CLASS)}
                  style={{ width: mobilePlanColumnWidth(row.depth) }}
                >
                {metricIds.map((id) => {
                  const cell = getMobileScheduleCellValue(id, row.item, allPlans);
                  const editable = isScheduleCellEditable(id, row.item, allPlans);
                  const readOnlyTitle = localizeScheduleReadOnlyTitle(t, {
                    rollupActuals:
                      (id === "actualStart" || id === "actualEnd") &&
                      !editable &&
                      !row.item.contributionOnly,
                    virtual: Boolean(cell.virtual),
                    cellText: cell.text,
                  });
                  return (
                    <div
                      key={id}
                      className={cn(
                        "flex items-center justify-center border-b px-0.5 text-center text-[9px] tabular-nums leading-none text-gray-700 last:border-b-0 dark:text-gray-200",
                        DRAWER_ROW_BORDER_CLASS,
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
