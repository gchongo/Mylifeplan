"use client";

import { useState } from "react";
import { PlansBoardTitle } from "@/components/plans/plans-board-title";
import { useI18n } from "@/components/i18n/i18n-provider";
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
  const { t } = useI18n();
  const isMobileShell = useMobileShell();
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-3 overflow-hidden",
        isMobileShell ? "px-0" : "px-4 lg:px-6",
      )}
    >
      <div className={cn("shrink-0 space-y-2 pt-2", isMobileShell && "px-3")}>
        <PlansBoardTitle />
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="rounded-lg px-2 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-200/60 hover:text-gray-800 dark:hover:bg-gray-800/60 dark:hover:text-gray-200"
        >
          {t("kanban.newPlanOrContribution")}
        </button>
      </div>
      <PlanKanbanBoard
        initialPlans={initialPlans}
        className="min-h-0 flex-1"
        composeOpen={composeOpen}
        onComposeOpenChange={setComposeOpen}
      />
    </div>
  );
}
