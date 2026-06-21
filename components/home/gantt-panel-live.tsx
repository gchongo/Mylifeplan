"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import {
  GanttChart,
  type GanttChartHandle,
  type GanttTitleColumnLayout,
} from "@/components/gantt/gantt-chart";
import { GanttToolbarControls } from "@/components/gantt/gantt-toolbar-controls";
import { GANTT_COLLAPSED_RAIL_WIDTH, GANTT_TITLE_COLUMN_CLASS } from "@/lib/gantt-title-column";
import type { GanttScaleId } from "@/lib/gantt-scale";
import { cn } from "@/lib/utils";

export function GanttPanelLive({
  fullPage = false,
  className,
}: {
  fullPage?: boolean;
  className?: string;
}) {
  const ganttRef = useRef<GanttChartHandle>(null);
  const [scale, setScale] = useState<GanttScaleId>("month");
  const [titleColumn, setTitleColumn] = useState<GanttTitleColumnLayout>({
    width: 200,
    visible: true,
    collapsedWidth: GANTT_COLLAPSED_RAIL_WIDTH,
  });

  const onTitleColumnLayout = useCallback((layout: GanttTitleColumnLayout) => {
    setTitleColumn(layout);
  }, []);

  const titleRailWidth = titleColumn.visible
    ? titleColumn.width
    : titleColumn.collapsedWidth;

  const toolbar = (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <GanttToolbarControls
        scale={scale}
        onScaleChange={setScale}
        onPrev={() => ganttRef.current?.navigatePrev()}
        onNext={() => ganttRef.current?.navigateNext()}
        onToday={() => ganttRef.current?.goToday()}
      />
      {fullPage ? (
        <Link
          href="/calendar"
          className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:inline-block"
        >
          在日历中管理
        </Link>
      ) : (
        <PanelExpandButton href="/gantt" label="甘特图" />
      )}
    </div>
  );

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden",
        fullPage && "rounded-lg border border-gray-200 shadow-sm dark:border-gray-800",
        className,
      )}
    >
      {fullPage ? (
        <div className="flex shrink-0 border-b border-amber-200/90 dark:border-amber-900/60">
          <div
            className={cn("shrink-0", GANTT_TITLE_COLUMN_CLASS)}
            style={{ width: titleRailWidth }}
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 items-center gap-3 bg-white px-3 py-2.5 dark:bg-gray-900">
            <CardTitle className="shrink-0 text-base">甘特图 · 看全局</CardTitle>
            {toolbar}
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 flex-row items-center gap-3 px-4 pb-2 pt-4">
          <CardTitle className="shrink-0 text-base">甘特图 · 看全局</CardTitle>
          {toolbar}
        </div>
      )}

      <CardContent
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          fullPage ? "p-0 pt-0" : "px-2 pb-2 pt-0",
        )}
      >
        <GanttChart
          ref={ganttRef}
          fullPage={fullPage}
          scale={scale}
          onScaleChange={setScale}
          onTitleColumnLayout={fullPage ? onTitleColumnLayout : undefined}
        />
      </CardContent>
    </Card>
  );
}
