"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import { GanttChart, type GanttChartHandle } from "@/components/gantt/gantt-chart";
import { GanttToolbarControls } from "@/components/gantt/gantt-toolbar-controls";
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

  return (
    <Card className={cn("flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden", className)}>
      {!fullPage && (
        <CardHeader className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 space-y-0 pb-2">
          <CardTitle className="truncate">甘特图 · 看全局</CardTitle>
          <GanttToolbarControls
            scale={scale}
            onScaleChange={setScale}
            onPrev={() => ganttRef.current?.navigatePrev()}
            onNext={() => ganttRef.current?.navigateNext()}
            onToday={() => ganttRef.current?.goToday()}
          />
          <PanelExpandButton href="/gantt" label="甘特图" />
        </CardHeader>
      )}
      <CardContent
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          fullPage ? "p-0" : "px-2 pb-2 pt-0",
        )}
      >
        <GanttChart ref={ganttRef} fullPage={fullPage} scale={scale} onScaleChange={setScale} />
      </CardContent>
    </Card>
  );
}
