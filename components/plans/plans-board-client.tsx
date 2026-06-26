"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";
import { PageRefreshButton } from "@/components/ui/page-refresh-button";
import { PlansBoardTitle } from "@/components/plans/plans-board-title";
import type { PlanKanbanBoardHandle } from "@/components/plans/plan-kanban-board";
import type { KanbanPlan } from "@/lib/kanban-board";

const PlanKanbanBoard = dynamic(
  () => import("@/components/plans/plan-kanban-board").then((m) => m.PlanKanbanBoard),
  { loading: () => <PanelSkeleton className="h-[60vh] min-h-[20rem]" />, ssr: false },
);

export function PlansBoardClient({ initialPlans }: { initialPlans: KanbanPlan[] }) {
  const kanbanRef = useRef<PlanKanbanBoardHandle>(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-4 lg:px-6">
      <div className="flex shrink-0 items-center gap-1.5 pt-2">
        <PlansBoardTitle />
        <PageRefreshButton onRefresh={() => kanbanRef.current?.reload()} />
      </div>
      <PlanKanbanBoard ref={kanbanRef} initialPlans={initialPlans} className="min-h-0 flex-1" />
    </div>
  );
}
