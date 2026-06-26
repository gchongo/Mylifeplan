"use client";

import dynamic from "next/dynamic";
import { useMobileShell } from "@/hooks/use-mobile-shell";
import { GanttMobileChart } from "@/components/gantt/gantt-mobile-chart";
import { GanttChart, type GanttChartHandle } from "@/components/gantt/gantt-chart";
import { GanttToolbarControls } from "@/components/gantt/gantt-toolbar-controls";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { GanttScaleId } from "@/lib/gantt-scale";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

export function GanttPanelLive({
  fullPage = false,
  className,
}: {
  fullPage?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const isMobileShell = useMobileShell();
  const ganttRef = useRef<GanttChartHandle>(null);
  const [scale, setScale] = useState<GanttScaleId>("month");

  if (isMobileShell) {
    return (
      <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
        <div className="shrink-0 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("gantt.homeTitle")}
          </h1>
        </div>
        <GanttMobileChart className="min-h-0 flex-1" />
      </div>
    );
  }

  const toolbar = (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <GanttToolbarControls
        scale={scale}
        onScaleChange={setScale}
        onPrev={() => ganttRef.current?.navigatePrev()}
        onNext={() => ganttRef.current?.navigateNext()}
        onToday={() => ganttRef.current?.goToday()}
      />
      {fullPage ? null : <PanelExpandButton href="/gantt" label={t("gantt.panelExpand")} />}
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
      <div className="flex shrink-0 flex-row items-center gap-3 px-4 pb-2 pt-4">
        <CardTitle className="shrink-0 text-base">{t("gantt.homeTitle")}</CardTitle>
        {toolbar}
      </div>

      <CardContent
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          fullPage ? "p-0 pt-0" : "px-2 pb-2 pt-0",
        )}
      >
        <GanttChart ref={ganttRef} fullPage={fullPage} scale={scale} onScaleChange={setScale} />
      </CardContent>
    </Card>
  );
}
