"use client";

import { PlansBoardTitle } from "@/components/plans/plans-board-title";
import { useMobileShell } from "@/hooks/use-mobile-shell";
import type { KanbanPlan } from "@/lib/kanban-board";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";

const PlanKanbanBoard = dynamic(
  () => import("@/components/plans/plan-kanban-board").then((m) => m.PlanKanbanBoard),
  { loading: () => <PanelSkeleton className="h-[60vh] min-h-[20rem]" />, ssr: false },
);

export function PlansBoardClient({ initialPlans }: { initialPlans: KanbanPlan[] }) {
  const isMobileShell = useMobileShell();

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-3 overflow-hidden",
        isMobileShell ? "px-0" : "px-4 lg:px-6",
      )}
    >
      <div className={cn("shrink-0 pt-2", isMobileShell && "px-3")}>
        <PlansBoardTitle />
      </div>
      <PlanKanbanBoard initialPlans={initialPlans} className="min-h-0 flex-1" />
    </div>
  );
}
