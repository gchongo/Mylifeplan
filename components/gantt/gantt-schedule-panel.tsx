"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { GANTT_TITLE_DRAWER_CLASS, GANTT_TITLE_ROW_CLASS } from "@/lib/gantt-title-column";
import {
  GANTT_TITLE_COL_WIDTH,
  getScheduleCellValue,
  scheduleColumnsTotalWidth,
  visibleScheduleColumnDefs,
  type GanttScheduleColumnId,
} from "@/lib/gantt-schedule-columns";
import { cn } from "@/lib/utils";
import type { GanttItem } from "@/types";

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
  const panelRef = useRef<HTMLDivElement>(null);
  const columnDefs = visibleScheduleColumnDefs(visibleColumns);
  const columnsWidth = scheduleColumnsTotalWidth(visibleColumns);
  const titleWidth = Math.min(GANTT_TITLE_COL_WIDTH, Math.max(108, width - 48));
  const scrollAreaWidth = Math.max(0, width - titleWidth);

  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;
    const scrollers = root.querySelectorAll<HTMLElement>("[data-gantt-schedule-scroll]");
    if (scrollers.length < 2) return;

    let syncing = false;
    function onScroll(e: Event) {
      if (syncing) return;
      const target = e.currentTarget as HTMLElement;
      syncing = true;
      const left = target.scrollLeft;
      scrollers.forEach((el) => {
        if (el !== target) el.scrollLeft = left;
      });
      syncing = false;
    }

    scrollers.forEach((el) => el.addEventListener("scroll", onScroll, { passive: true }));
    return () => scrollers.forEach((el) => el.removeEventListener("scroll", onScroll));
  }, [visibleColumns.join(","), rows.length]);

  return (
    <div ref={panelRef} className={cn("flex flex-col", GANTT_TITLE_DRAWER_CLASS)} style={{ width, minHeight: bodyHeight }}>
      <div className="flex shrink-0 border-b border-blue-200/80 bg-blue-100/50 dark:border-blue-900/50 dark:bg-blue-900/30">
        <div
          className="shrink-0 px-2 py-1 text-[10px] font-medium text-gray-500 dark:text-gray-400"
          style={{ width: titleWidth }}
        >
          任务
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto" data-gantt-schedule-scroll>
          <div className="flex" style={{ minWidth: columnsWidth }}>
            {columnDefs.map((col) => (
              <div
                key={col.id}
                className="shrink-0 border-l border-blue-200/60 px-1 py-1 text-center text-[10px] font-medium text-gray-500 dark:border-blue-900/40 dark:text-gray-400"
                style={{ width: col.width }}
                title={col.label}
              >
                {col.shortLabel}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="flex"
            style={{ height: row.height, marginTop: row.gapBefore }}
          >
            <div
              className={cn(
                "shrink-0 overflow-hidden",
                !row.tightBelow && GANTT_TITLE_ROW_CLASS,
              )}
              style={{ width: titleWidth }}
            >
              {renderTitleCell(row, index)}
            </div>
            <div
              className={cn(
                "min-w-0 flex-1 overflow-x-auto",
                !row.tightBelow && "border-b border-blue-100/90 dark:border-blue-900/45",
              )}
              data-gantt-schedule-scroll
              style={{ maxWidth: scrollAreaWidth }}
            >
              <div className="flex h-full items-center" style={{ minWidth: columnsWidth }}>
                {columnDefs.map((col) => {
                  const cell = getScheduleCellValue(col.id, row.item, allPlans);
                  return (
                    <div
                      key={col.id}
                      className={cn(
                        "shrink-0 border-l border-blue-100/80 px-1 text-center text-[10px] tabular-nums leading-tight dark:border-blue-900/35",
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
