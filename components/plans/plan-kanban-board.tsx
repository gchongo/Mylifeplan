"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  groupPlansByKanbanColumn,
  kanbanArchivePatch,
  kanbanCanDrag,
  kanbanCanMoveToUnscheduled,
  kanbanColumnForPlan,
  kanbanPatchForColumn,
  kanbanRestorePatch,
  kanbanVisualForZone,
  KANBAN_COLUMNS,
  UNSCHEDULED_BLOCKED_HINT,
  type KanbanColumnId,
  type KanbanDropZoneId,
  type KanbanPlan,
} from "@/lib/kanban-board";
import { getKanbanColumnAccentClass, getKanbanTitleBarStyle } from "@/lib/task-status-style";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { queryKeys } from "@/lib/query/keys";
import { apiJson } from "@/lib/client-api";
import { ROLLUP_STATUS_HINT } from "@/lib/services/plan-rollup";
import { PlanDetailModal } from "@/components/plans/plan-detail-modal";
import { PlanContributionComposeModal } from "@/components/forms/plan-contribution-compose-modal";
import { DrawerLayout, DrawerPanel } from "@/components/ui/drawer";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

function PlanKanbanCard({
  plan,
  zoneId,
  dragging,
  onDragStart,
  onDragEnd,
  onOpenPlan,
}: {
  plan: KanbanPlan;
  zoneId: KanbanDropZoneId;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpenPlan: (planId: string) => void;
}) {
  const draggable = kanbanCanDrag(plan);
  const visual = kanbanVisualForZone(zoneId);
  const titleBar = getKanbanTitleBarStyle(visual);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData("text/plan-id", plan.id);
        e.dataTransfer.setData("text/from-archived", zoneId === "archived" ? "1" : "0");
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      title={draggable ? undefined : ROLLUP_STATUS_HINT}
      className={cn(
        "w-full shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow dark:border-gray-700 dark:bg-gray-900",
        zoneId === "archived" && "opacity-90",
        draggable ? "cursor-grab active:cursor-grabbing hover:shadow-md" : "cursor-default opacity-95",
        dragging && "opacity-40",
      )}
    >
      <div className={cn("px-3 py-2", titleBar.shell)}>
        {plan.parentTitle && (
          <p className="mb-0.5 truncate text-[10px] text-gray-400 dark:text-gray-500">↑ {plan.parentTitle}</p>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPlan(plan.id);
          }}
          className={cn("block w-full text-left text-sm font-semibold hover:opacity-80", titleBar.text)}
        >
          {plan.title}
        </button>
      </div>
      {plan.description && (
        <div className="px-3 pb-3 pt-0">
          <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  columnId,
  label,
  plans,
  draggingId,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenPlan,
  onCreatePlan,
  newPlanLabel,
}: {
  columnId: KanbanColumnId;
  label: string;
  plans: KanbanPlan[];
  draggingId: string | null;
  dropTarget: KanbanDropZoneId | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (zoneId: KanbanDropZoneId) => void;
  onDragLeave: () => void;
  onDrop: (columnId: KanbanColumnId, planId: string, fromArchived: boolean) => void;
  onOpenPlan: (planId: string) => void;
  onCreatePlan: () => void;
  newPlanLabel: string;
}) {
  const isTarget = dropTarget === columnId && draggingId !== null;
  const visual = kanbanVisualForZone(columnId);
  const accent = getKanbanColumnAccentClass(visual);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col rounded-xl bg-gray-100/80 p-2 transition-colors dark:bg-gray-900/60",
        isTarget && "ring-2 ring-brand-400 ring-offset-1 dark:ring-offset-gray-950",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(columnId);
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        const planId = e.dataTransfer.getData("text/plan-id");
        const fromArchived = e.dataTransfer.getData("text/from-archived") === "1";
        onDragEnd();
        if (planId) onDrop(columnId, planId, fromArchived);
      }}
    >
      <div className="mb-2 flex shrink-0 items-center gap-2 px-1">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", accent)} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </span>
        <span className="text-xs text-gray-400">{plans.length}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
        <div className="flex flex-col gap-2">
          {plans.map((plan) => (
            <PlanKanbanCard
              key={plan.id}
              plan={plan}
              zoneId={columnId}
              dragging={draggingId === plan.id}
              onDragStart={() => onDragStart(plan.id)}
              onDragEnd={onDragEnd}
              onOpenPlan={onOpenPlan}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onCreatePlan}
        className="mt-2 block w-full shrink-0 rounded-lg px-2 py-2 text-center text-sm text-gray-500 hover:bg-gray-200/60 hover:text-gray-800 dark:hover:bg-gray-800/60 dark:hover:text-gray-200"
      >
        {newPlanLabel}
      </button>
    </div>
  );
}

function KanbanArchivedDrawerPanel({
  plans,
  draggingId,
  dropTarget,
  onClose,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenPlan,
  title,
  dropHint,
  emptyText,
}: {
  plans: KanbanPlan[];
  draggingId: string | null;
  dropTarget: KanbanDropZoneId | null;
  onClose: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (planId: string) => void;
  onOpenPlan: (planId: string) => void;
  title: string;
  dropHint: string;
  emptyText: string;
}) {
  const isTarget = dropTarget === "archived" && draggingId !== null;

  return (
    <DrawerPanel title={title} onClose={onClose} className="p-0">
      <div
        className={cn(
          "flex min-h-full flex-col gap-2 p-3 transition-colors",
          isTarget && "bg-gray-100/80 dark:bg-gray-800/40",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          onDragOver();
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          const planId = e.dataTransfer.getData("text/plan-id");
          const fromArchived = e.dataTransfer.getData("text/from-archived") === "1";
          onDragEnd();
          if (planId && !fromArchived) onDrop(planId);
        }}
      >
        {isTarget && (
          <p className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">
            {dropHint}
          </p>
        )}
        {plans.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">{emptyText}</p>
        ) : (
          plans.map((plan) => (
            <PlanKanbanCard
              key={plan.id}
              plan={plan}
              zoneId="archived"
              dragging={draggingId === plan.id}
              onDragStart={() => onDragStart(plan.id)}
              onDragEnd={onDragEnd}
              onOpenPlan={onOpenPlan}
            />
          ))
        )}
      </div>
    </DrawerPanel>
  );
}

export function PlanKanbanBoard({
  initialPlans,
  className,
}: {
  initialPlans: KanbanPlan[];
  className?: string;
}) {
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<KanbanDropZoneId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [planModalId, setPlanModalId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const { t } = useI18n();
  const qc = useQueryClient();
  const activeKey = queryKeys.plans.list();
  const archivedKey = queryKeys.plans.list("archived");

  const { data: activeData } = useQuery({
    queryKey: queryKeys.plans.list(),
    queryFn: () => apiJson<{ plans?: KanbanPlan[] }>("/api/plans"),
    initialData: { plans: initialPlans },
  });

  const { data: archivedData } = useQuery({
    queryKey: archivedKey,
    queryFn: () => apiJson<{ plans?: KanbanPlan[] }>("/api/plans?status=archived"),
  });

  const plans = activeData?.plans ?? initialPlans;
  const archivedPlans = archivedData?.plans ?? [];

  const grouped = useMemo(() => groupPlansByKanbanColumn(plans), [plans]);

  const movePlan = useCallback(
    async (planId: string, targetColumn: KanbanColumnId, fromArchived: boolean) => {
      const activePlan = plans.find((p) => p.id === planId);
      const archivedPlan = archivedPlans.find((p) => p.id === planId);
      const plan = fromArchived ? archivedPlan : activePlan;
      if (!plan) return;

      if (!kanbanCanDrag(plan)) {
        setError(ROLLUP_STATUS_HINT);
        return;
      }

      if (fromArchived) {
        let patch;
        try {
          patch = kanbanRestorePatch(targetColumn, plan);
        } catch (e) {
          setError(e instanceof Error ? e.message : UNSCHEDULED_BLOCKED_HINT);
          return;
        }

        setMoving(true);
        setError(null);
        const prevArchived = archivedPlans;
        const prevActive = plans;
        qc.setQueryData(archivedKey, {
          plans: archivedPlans.filter((p) => p.id !== planId),
        });

        try {
          const res = await fetch(`/api/plans/${planId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? t("common.restoreFailed"));
          dispatchPlanUpdated(data.plan ? { plan: data.plan } : undefined);
        } catch (e) {
          qc.setQueryData(archivedKey, { plans: prevArchived });
          qc.setQueryData(activeKey, { plans: prevActive });
          setError(e instanceof Error ? e.message : t("common.restoreFailed"));
        } finally {
          setMoving(false);
        }
        return;
      }

      const currentColumn = kanbanColumnForPlan(plan);
      if (currentColumn === targetColumn) return;

      if (targetColumn === "unscheduled" && !kanbanCanMoveToUnscheduled(plan)) {
        setError(UNSCHEDULED_BLOCKED_HINT);
        return;
      }

      let patch;
      try {
        patch = kanbanPatchForColumn(targetColumn, plan);
      } catch (e) {
        setError(e instanceof Error ? e.message : UNSCHEDULED_BLOCKED_HINT);
        return;
      }

      setMoving(true);
      setError(null);

      const prevPlans = plans;
      qc.setQueryData(activeKey, {
        plans: plans.map((p) =>
          p.id === planId
            ? {
                ...p,
                status: patch.status,
                startDate: patch.startDate !== undefined ? patch.startDate : p.startDate,
                endDate: patch.endDate !== undefined ? patch.endDate : p.endDate,
              }
            : p,
        ),
      });

      try {
        const res = await fetch(`/api/plans/${planId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? t("common.updateFailed"));
        dispatchPlanUpdated(data.plan ? { plan: data.plan } : undefined);
      } catch (e) {
        qc.setQueryData(activeKey, { plans: prevPlans });
        setError(e instanceof Error ? e.message : t("common.updateFailed"));
      } finally {
        setMoving(false);
      }
    },
    [activeKey, archivedKey, archivedPlans, plans, qc, t],
  );

  const archivePlan = useCallback(
    async (planId: string) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      if (!kanbanCanDrag(plan)) {
        setError(ROLLUP_STATUS_HINT);
        return;
      }

      const patch = kanbanArchivePatch();
      setMoving(true);
      setError(null);
      const prevPlans = plans;
      const prevArchived = archivedPlans;
      qc.setQueryData(activeKey, { plans: plans.filter((p) => p.id !== planId) });

      try {
        const res = await fetch(`/api/plans/${planId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? t("common.archiveFailed"));
        dispatchPlanUpdated(data.plan ? { plan: data.plan } : undefined);
      } catch (e) {
        qc.setQueryData(activeKey, { plans: prevPlans });
        qc.setQueryData(archivedKey, { plans: prevArchived });
        setError(e instanceof Error ? e.message : t("common.archiveFailed"));
      } finally {
        setMoving(false);
      }
    },
    [activeKey, archivedKey, archivedPlans, plans, qc, t],
  );

  const archivedAccent = getKanbanColumnAccentClass("archived");
  const archivedDropTarget = dropTarget === "archived" && draggingId !== null;

  return (
    <DrawerLayout
      open={archivedOpen}
      onClose={() => setArchivedOpen(false)}
      widthClass="w-80 sm:w-96"
      panel={
        <KanbanArchivedDrawerPanel
          plans={archivedPlans}
          draggingId={draggingId}
          dropTarget={dropTarget}
          onClose={() => setArchivedOpen(false)}
          onDragStart={setDraggingId}
          onDragEnd={() => {
            setDraggingId(null);
            setDropTarget(null);
          }}
          onDragOver={() => setDropTarget("archived")}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(planId) => void archivePlan(planId)}
          onOpenPlan={setPlanModalId}
          title={t("kanban.archivedTitle", { count: archivedPlans.length })}
          dropHint={t("kanban.dropToArchivePanel")}
          emptyText={t("kanban.archivedEmpty")}
        />
      }
    >
      <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
        <div className="flex shrink-0 justify-end">
          <button
            type="button"
            onClick={() => setArchivedOpen(true)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDropTarget("archived");
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault();
              const planId = e.dataTransfer.getData("text/plan-id");
              const fromArchived = e.dataTransfer.getData("text/from-archived") === "1";
              setDraggingId(null);
              setDropTarget(null);
              if (planId && !fromArchived) void archivePlan(planId);
            }}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800",
              archivedDropTarget && "ring-2 ring-gray-400 ring-offset-1",
            )}
          >
            <span className={cn("h-2 w-2 shrink-0 rounded-full", archivedAccent)} aria-hidden />
            <span>{t("kanban.archived")}</span>
            <span className="text-xs text-gray-400">{archivedPlans.length}</span>
            {archivedDropTarget && (
              <span className="text-xs text-gray-500">{t("kanban.dropToArchive")}</span>
            )}
          </button>
        </div>

        {error && (
          <p className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-4 gap-3",
            moving && "pointer-events-none opacity-80",
          )}
        >
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              columnId={col.id}
              label={t(`kanban.column.${col.id}`)}
              plans={grouped[col.id]}
              draggingId={draggingId}
              dropTarget={dropTarget}
              onDragStart={setDraggingId}
              onDragEnd={() => {
                setDraggingId(null);
                setDropTarget(null);
              }}
              onDragOver={setDropTarget}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(columnId, planId, fromArchived) => {
                void movePlan(planId, columnId, fromArchived);
              }}
              onOpenPlan={setPlanModalId}
              onCreatePlan={() => setComposeOpen(true)}
              newPlanLabel={t("kanban.newPlanOrContribution")}
            />
          ))}
        </div>

        <PlanContributionComposeModal
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
        />

        <PlanDetailModal
          planId={planModalId}
          open={planModalId !== null}
          onClose={() => setPlanModalId(null)}
        />
      </div>
    </DrawerLayout>
  );
}
