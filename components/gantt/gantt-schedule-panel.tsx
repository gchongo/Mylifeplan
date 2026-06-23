"use client";

import type { ReactNode } from "react";
import { GanttPanelCollapseChevron } from "@/components/gantt/gantt-panel-chevron";
import { GANTT_TITLE_DRAWER_CLASS, GANTT_TITLE_ROW_CLASS } from "@/lib/gantt-title-column";
import {
  GANTT_SCHEDULE_TABLE_HEADER_HEIGHT,
  getScheduleCellValue,
  scheduleColumnsTotalWidth,
  visibleScheduleColumnDefs,
  type GanttScheduleColumnId,
} from "@/lib/gantt-schedule-columns";
import { cn } from "@/lib/utils";
import type { GanttItem } from "@/types";

export function GanttTitleTableHeader({ width }: { width: number }) {
  return (
    <div
      className="flex shrink-0 border-b border-blue-200/80 bg-blue-100/50 dark:border-blue-900/50 dark:bg-blue-900/30"
      style={{ width, height: GANTT_SCHEDULE_TABLE_HEADER_HEIGHT, minHeight: GANTT_SCHEDULE_TABLE_HEADER_HEIGHT }}
    >
      <div className="flex w-full items-center justify-center text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">
        任务
      </div>
    </div>
  );
}

export function GanttScheduleColumnHeader({
  width,
  visibleColumns,
  scrollLeft,
}: {
  width: number;
  visibleColumns: GanttScheduleColumnId[];
  scrollLeft: number;
}) {
  const columnDefs = visibleScheduleColumnDefs(visibleColumns);
  const columnsWidth = scheduleColumnsTotalWidth(visibleColumns);

  return (
    <div
      className="flex shrink-0 overflow-hidden border-b border-blue-200/80 bg-blue-100/50 dark:border-blue-900/50 dark:bg-blue-900/30"
      style={{ width, height: GANTT_SCHEDULE_TABLE_HEADER_HEIGHT, minHeight: GANTT_SCHEDULE_TABLE_HEADER_HEIGHT }}
    >
      <div
        className="flex"
        style={{ minWidth: columnsWidth, transform: `translateX(-${scrollLeft}px)` }}
      >
        {columnDefs.map((col) => (
          <div
            key={col.id}
            className="flex shrink-0 items-center justify-center border-l border-blue-200/60 px-1 text-center text-[10px] font-medium text-gray-500 dark:border-blue-900/40 dark:text-gray-400"
            style={{ width: col.width, height: GANTT_SCHEDULE_TABLE_HEADER_HEIGHT }}
            title={col.label}
          >
            {col.shortLabel}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GanttScheduleColumnNav({
  canScrollPrev,
  canScrollNext,
  onScrollPrev,
  onScrollNext,
  onHidePanel,
  trailing,
}: {
  canScrollPrev: boolean;
  canScrollNext: boolean;
  onScrollPrev: () => void;
  onScrollNext: () => void;
  onHidePanel?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex h-full w-full items-center gap-0.5 px-1">
      {onHidePanel && (
        <button
          type="button"
          data-no-pan
          onClick={onHidePanel}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          title="收起时间列"
          aria-label="收起时间列"
        >
          <GanttPanelCollapseChevron className="text-blue-600 dark:text-blue-300" />
        </button>
      )}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
        <button
          type="button"
          data-no-pan
          disabled={!canScrollPrev}
          onClick={onScrollPrev}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-base font-semibold leading-none",
            "text-blue-700 hover:bg-blue-100/80 dark:text-blue-200 dark:hover:bg-blue-900/40",
            "disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-60 dark:disabled:text-gray-500",
          )}
          title="上一列"
          aria-label="上一列"
        >
          ‹
        </button>
        <button
          type="button"
          data-no-pan
          disabled={!canScrollNext}
          onClick={onScrollNext}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-base font-semibold leading-none",
            "text-blue-700 hover:bg-blue-100/80 dark:text-blue-200 dark:hover:bg-blue-900/40",
            "disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-60 dark:disabled:text-gray-500",
          )}
          title="下一列"
          aria-label="下一列"
        >
          ›
        </button>
      </div>
      {trailing}
    </div>
  );
}

/** @deprecated use GanttTitleTableHeader + GanttScheduleColumnHeader */
export function GanttScheduleTableHeader({
  width,
  visibleColumns,
}: {
  width: number;
  visibleColumns: GanttScheduleColumnId[];
}) {
  const titleWidth = Math.min(140, Math.max(108, width - 48));
  const scrollAreaWidth = Math.max(0, width - titleWidth);
  return (
    <div
      className="flex shrink-0 border-b border-blue-200/80 bg-blue-100/50 dark:border-blue-900/50 dark:bg-blue-900/30"
      style={{ height: GANTT_SCHEDULE_TABLE_HEADER_HEIGHT, minHeight: GANTT_SCHEDULE_TABLE_HEADER_HEIGHT }}
    >
      <GanttTitleTableHeader width={titleWidth} />
      <GanttScheduleColumnHeader width={scrollAreaWidth} visibleColumns={visibleColumns} scrollLeft={0} />
    </div>
  );
}

export function GanttTitlePanel({
  width,
  bodyHeight,
  rows,
  renderTitleCell,
}: {
  width: number;
  bodyHeight: number;
  rows: {
    key: string;
    height: number;
    gapBefore: number;
    tightBelow: boolean;
    item: GanttItem;
  }[];
  renderTitleCell: (row: {
    item: GanttItem;
    height: number;
    gapBefore: number;
    tightBelow: boolean;
  }, index: number) => ReactNode;
}) {
  return (
    <div className={cn("flex flex-col", GANTT_TITLE_DRAWER_CLASS)} style={{ width, minHeight: bodyHeight }}>
      <div className="flex min-h-0 flex-1 flex-col">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className={cn(
              "overflow-hidden",
              !row.tightBelow && GANTT_TITLE_ROW_CLASS,
            )}
            style={{ height: row.height, marginTop: row.gapBefore }}
          >
            {renderTitleCell(row, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GanttScheduleColumnPanel({
  width,
  bodyHeight,
  visibleColumns,
  scrollLeft,
  rows,
  allPlans,
}: {
  width: number;
  bodyHeight: number;
  visibleColumns: GanttScheduleColumnId[];
  scrollLeft: number;
  rows: {
    key: string;
    height: number;
    gapBefore: number;
    tightBelow: boolean;
    item: GanttItem;
  }[];
  allPlans: GanttItem[];
}) {
  const columnDefs = visibleScheduleColumnDefs(visibleColumns);
  const columnsWidth = scheduleColumnsTotalWidth(visibleColumns);

  return (
    <div
      className={cn("flex flex-col border-r border-blue-200/80 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/40")}
      style={{ width, minHeight: bodyHeight }}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.key}
            className={cn(
              "overflow-hidden",
              !row.tightBelow && "border-b border-blue-100/90 dark:border-blue-900/45",
            )}
            style={{ height: row.height, marginTop: row.gapBefore }}
          >
            <div className="flex h-full items-center overflow-hidden">
              <div
                className="flex h-full items-center"
                style={{ minWidth: columnsWidth, transform: `translateX(-${scrollLeft}px)` }}
              >
                {columnDefs.map((col) => {
                  const cell = getScheduleCellValue(col.id, row.item, allPlans);
                  return (
                    <div
                      key={col.id}
                      className={cn(
                        "flex h-full shrink-0 items-center justify-center border-l border-blue-100/80 px-1 text-center text-[10px] tabular-nums leading-tight dark:border-blue-900/35",
                        cell.muted && "text-gray-400",
                        cell.virtual && "italic text-gray-500",
                        cell.highlight && "bg-amber-50 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
                        !cell.muted && !cell.virtual && !cell.highlight && "text-gray-600 dark:text-gray-300",
                      )}
                      style={{ width: col.width }}
                      title={cell.virtual ? `${cell.text}（预估截止）` : cell.text}
                    >
                      {cell.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** @deprecated use GanttTitlePanel + GanttScheduleColumnPanel */
export function GanttSchedulePanel({
  width,
  bodyHeight,
  visibleColumns,
  rows,
  allPlans,
  renderTitleCell,
}: {
  width: number;
  bodyHeight: number;
  visibleColumns: GanttScheduleColumnId[];
  rows: {
    key: string;
    height: number;
    gapBefore: number;
    tightBelow: boolean;
    item: GanttItem;
  }[];
  allPlans: GanttItem[];
  renderTitleCell: (row: {
    item: GanttItem;
    height: number;
    gapBefore: number;
    tightBelow: boolean;
  }, index: number) => ReactNode;
}) {
  const titleWidth = Math.min(140, Math.max(108, width - 48));
  const scheduleWidth = Math.max(0, width - titleWidth);
  return (
    <div className="flex" style={{ width, minHeight: bodyHeight }}>
      <GanttTitlePanel width={titleWidth} bodyHeight={bodyHeight} rows={rows} renderTitleCell={renderTitleCell} />
      <GanttScheduleColumnPanel
        width={scheduleWidth}
        bodyHeight={bodyHeight}
        visibleColumns={visibleColumns}
        scrollLeft={0}
        rows={rows}
        allPlans={allPlans}
      />
    </div>
  );
}
