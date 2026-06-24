"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  groupPlansByKanbanColumn,
  kanbanArchivePatch,
  kanbanCanDrag,
  kanbanCanMoveToUnscheduled,
  kanbanColumnForPlan,
  kanbanPatchForColumn,
  kanbanRestorePatch,
  kanbanVisualForZone,
  KANBAN_ARCHIVED_STORAGE_KEY,
  KANBAN_COLUMNS,
  PLAN_TYPE_LABELS,
  UNSCHEDULED_BLOCKED_HINT,
  type KanbanColumnId,
  type KanbanDropZoneId,
  type KanbanPlan,
} from "@/lib/kanban-board";
import { getKanbanColumnAccentClass, getKanbanTitleBarStyle } from "@/lib/task-status-style";
import { dispatchPlanUpdated, PLAN_UPDATED_EVENT } from "@/lib/plan-events";
import { apiJson } from "@/lib/client-api";
import { ROLLUP_STATUS_HINT } from "@/lib/services/plan-rollup";
import { PlanDetailModal } from "@/components/plans/plan-detail-modal";
import { PlanContributionComposeModal } from "@/components/forms/plan-contribution-compose-modal";
import { cn } from "@/lib/utils";

function readArchivedOpen(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KANBAN_ARCHIVED_STORAGE_KEY) === "true";
}

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
        "w-[220px] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow dark:border-gray-700 dark:bg-gray-900",
        zoneId === "archived" && "opacity-90",
        draggable ? "cursor-grab active:cursor-grabbing hover:shadow-md" : "cursor-default opacity-95",
        dragging && "opacity-40",
      )}
    >
      <div className={cn("px-3 py-2", titleBar.shell)}>
        {plan.parentTitle && (
          <p className="mb-0.5 truncate text-[10px] text-gray-400">↑ {plan.parentTitle}</p>
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
      <div className="p-3 pt-2">
        {plan.description && (
          <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
        )}
        <div className={plan.description ? "mt-2" : undefined}>
          <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {PLAN_TYPE_LABELS[plan.type] ?? plan.type}
          </span>
        </div>
      </div>
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
}) {
  const isTarget = dropTarget === columnId && draggingId !== null;
  const visual = kanbanVisualForZone(columnId);
  const accent = getKanbanColumnAccentClass(visual);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-[240px] flex-1 flex-col rounded-xl bg-gray-100/80 p-2 transition-colors",
        isTarget && "ring-2 ring-brand-400 ring-offset-1",
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
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", accent)} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </span>
        <span className="text-xs text-gray-400">{plans.length}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain scrollbar-hide">
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

      <button
        type="button"
        onClick={onCreatePlan}
        className="mt-2 block w-full rounded-lg px-2 py-2 text-center text-sm text-gray-500 hover:bg-gray-200/60 hover:text-gray-800 dark:hover:bg-gray-800/60 dark:hover:text-gray-200"
      >
        ＋ 新建计划或贡献
      </button>
    </div>
  );
}

function KanbanArchivedTray({
  plans,
  expanded,
  draggingId,
  dropTarget,
  onToggle,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenPlan,
}: {
  plans: KanbanPlan[];
  expanded: boolean;
  draggingId: string | null;
  dropTarget: KanbanDropZoneId | null;
  onToggle: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (planId: string) => void;
  onOpenPlan: (planId: string) => void;
}) {
  const isTarget = dropTarget === "archived" && draggingId !== null;
  const accent = getKanbanColumnAccentClass("archived");

  return (
    <div
      className={cn(
        "shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/40",
        isTarget && "ring-2 ring-gray-400 ring-offset-1",
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
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-gray-800/50"
        aria-expanded={expanded}
      >
        <svg
          className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-90")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
        <span className={cn("h-2 w-2 shrink-0 rounded-full", accent)} aria-hidden />
        <span className="font-medium">已归档</span>
        <span className="text-xs text-gray-400">{plans.length}</span>
        {!expanded && isTarget && (
          <span className="ml-auto text-xs text-gray-500">松手归档</span>
        )}
      </button>

      {expanded && (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto border-t border-gray-200 px-3 py-2 dark:border-gray-700">
          {plans.length === 0 ? (
            <p className="py-2 text-xs text-gray-400">拖入计划以归档，或从详情页归档</p>
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
      )}
    </div>
  );
}

export function PlanKanbanBoard({
  initialPlans,
  className,
}: {
  initialPlans: KanbanPlan[];
  className?: string;
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [archivedPlans, setArchivedPlans] = useState<KanbanPlan[]>([]);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<KanbanDropZoneId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [planModalId, setPlanModalId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const grouped = useMemo(() => groupPlansByKanbanColumn(plans), [plans]);

  useEffect(() => {
    setArchivedOpen(readArchivedOpen());
  }, []);

  const reloadPlans = useCallback(async () => {
    const [active, archived] = await Promise.all([
      apiJson<{ plans?: KanbanPlan[] }>("/api/plans"),
      apiJson<{ plans?: KanbanPlan[] }>("/api/plans?status=archived"),
    ]);
    setPlans(active.plans ?? []);
    setArchivedPlans(archived.plans ?? []);
  }, []);

  useEffect(() => {
    void reloadPlans();
  }, [reloadPlans]);

  useEffect(() => {
    function onPlanUpdated() {
      void reloadPlans();
    }
    window.addEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
    return () => window.removeEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
  }, [reloadPlans]);

  function toggleArchivedOpen() {
    setArchivedOpen((prev) => {
      const next = !prev;
      localStorage.setItem(KANBAN_ARCHIVED_STORAGE_KEY, String(next));
      return next;
    });
  }

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
        setArchivedPlans((list) => list.filter((p) => p.id !== planId));

        try {
          const res = await fetch(`/api/plans/${planId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? "恢复失败");
          await reloadPlans();
          dispatchPlanUpdated();
        } catch (e) {
          setArchivedPlans(prevArchived);
          setPlans(prevActive);
          setError(e instanceof Error ? e.message : "恢复失败");
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
      setPlans((list) =>
        list.map((p) =>
          p.id === planId
            ? {
                ...p,
                status: patch.status,
                startDate: patch.startDate !== undefined ? patch.startDate : p.startDate,
                endDate: patch.endDate !== undefined ? patch.endDate : p.endDate,
              }
            : p,
        ),
      );

      try {
        const res = await fetch(`/api/plans/${planId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "更新失败");
        await reloadPlans();
        dispatchPlanUpdated();
      } catch (e) {
        setPlans(prevPlans);
        setError(e instanceof Error ? e.message : "更新失败");
      } finally {
        setMoving(false);
      }
    },
    [archivedPlans, plans, reloadPlans],
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
      setPlans((list) => list.filter((p) => p.id !== planId));

      try {
        const res = await fetch(`/api/plans/${planId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "归档失败");
        await reloadPlans();
        dispatchPlanUpdated();
      } catch (e) {
        setPlans(prevPlans);
        setArchivedPlans(prevArchived);
        setError(e instanceof Error ? e.message : "归档失败");
      } finally {
        setMoving(false);
      }
    },
    [archivedPlans, plans, reloadPlans],
  );

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="shrink-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          与甘特图共用计划数据。未排期（紫）与已归档（灰）分开；拖入列可改状态，拖入底部可归档。
        </p>
      </div>

      {error && (
        <p className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div
        className={cn(
          "scrollbar-hide flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden overscroll-contain pb-2",
          moving && "pointer-events-none opacity-80",
        )}
      >
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
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
          />
        ))}
      </div>

      <KanbanArchivedTray
        plans={archivedPlans}
        expanded={archivedOpen}
        draggingId={draggingId}
        dropTarget={dropTarget}
        onToggle={toggleArchivedOpen}
        onDragStart={setDraggingId}
        onDragEnd={() => {
          setDraggingId(null);
          setDropTarget(null);
        }}
        onDragOver={() => setDropTarget("archived")}
        onDragLeave={() => setDropTarget(null)}
        onDrop={(planId) => void archivePlan(planId)}
        onOpenPlan={setPlanModalId}
      />

      <PlanContributionComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSuccess={() => void reloadPlans()}
      />

      <PlanDetailModal
        planId={planModalId}
        open={planModalId !== null}
        onClose={() => setPlanModalId(null)}
        onChanged={reloadPlans}
      />
    </div>
  );
}
