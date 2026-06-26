"use client";

import dynamic from "next/dynamic";
import { useMobileShell } from "@/hooks/use-mobile-shell";
import { cn } from "@/lib/utils";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";

const GanttPanelLive = dynamic(
  () => import("@/components/home/gantt-panel-live").then((m) => m.GanttPanelLive),
  { loading: () => <PanelSkeleton className="h-[70vh] min-h-[24rem]" />, ssr: false },
);

export default function GanttFullPage() {
  const isMobileShell = useMobileShell();

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
        !isMobileShell && "px-4 lg:px-6",
      )}
    >
      <GanttPanelLive fullPage className="h-full min-h-0 flex-1" />
    </div>
  );
}
