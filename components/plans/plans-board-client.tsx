import dynamic from "next/dynamic";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";
import { PlansBoardTitle } from "@/components/plans/plans-board-title";
import type { KanbanPlan } from "@/lib/kanban-board";

const PlanKanbanBoard = dynamic(
  () => import("@/components/plans/plan-kanban-board").then((m) => m.PlanKanbanBoard),
  { loading: () => <PanelSkeleton className="h-[60vh] min-h-[20rem]" />, ssr: false },
);

export function PlansBoardClient({ initialPlans }: { initialPlans: KanbanPlan[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-4 lg:px-6">
      <div className="shrink-0 pt-2">
        <PlansBoardTitle />
      </div>
      <PlanKanbanBoard initialPlans={initialPlans} className="min-h-0 flex-1" />
    </div>
  );
}
