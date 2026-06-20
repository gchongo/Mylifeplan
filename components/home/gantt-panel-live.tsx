"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { cn } from "@/lib/utils";

export function GanttPanelLive({
  fullPage = false,
  className,
}: {
  fullPage?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden", className)}>
      {!fullPage && (
        <CardHeader className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 space-y-0 pb-2">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <CardTitle className="truncate">甘特图 · 看全局</CardTitle>
            <Badge variant="info" className="hidden shrink-0 xl:inline-flex">
              黄线 = 预估截止
            </Badge>
          </div>
          <PanelExpandButton href="/gantt" label="甘特图" />
        </CardHeader>
      )}
      <CardContent
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          fullPage ? "p-0" : "px-2 pb-2 pt-0",
        )}
      >
        <GanttChart fullPage={fullPage} />
      </CardContent>
    </Card>
  );
}
