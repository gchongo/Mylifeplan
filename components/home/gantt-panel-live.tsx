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
    <Card className={cn("flex h-full min-w-0 max-w-full flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>{fullPage ? "甘特图" : "甘特图 · 看全局"}</CardTitle>
          <Badge variant="info">黄线 = 预估截止</Badge>
        </div>
        {!fullPage && <PanelExpandButton href="/gantt" label="甘特图" />}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-0">
        <GanttChart fullPage={fullPage} />
      </CardContent>
    </Card>
  );
}
