"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  groupPlansByKanbanColumn,
  kanbanCanDrag,
  kanbanCanMoveToUnscheduled,
  kanbanColumnForPlan,
  kanbanPatchForColumn,
  KANBAN_COLUMNS,
  PLAN_TYPE_LABELS,
  UNSCHEDULED_BLOCKED_HINT,
  type KanbanColumnId,
  type KanbanPlan,
} from "@/lib/kanban-board";
import { dispatchPlanUpdated, PLAN_UPDATED_EVENT } from "@/lib/plan-events";
import { apiJson } from "@/lib/client-api";
import { ROLLUP_STATUS_HINT } from "@/lib/services/plan-rollup";
import { PlanDetailModal } from "@/components/plans/plan-detail-modal";
import { PlanContributionComposeModal } from "@/components/forms/plan-contribution-compose-modal";
import { cn } from "@/lib/utils";

function PlanKanbanCard({
  plan,
  dragging,
  onDragStart,
  onDragEnd,
  onOpenPlan,
}: {
  plan: KanbanPlan;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpenPlan: (planId: string) => void;
}) {
  const draggable = kanbanCanDrag(plan);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData("text/plan-id", plan.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      title={draggable ? undefined : ROLLUP_STATUS_HINT}
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow",
        draggable ? "cursor-grab active:cursor-grabbing hover:shadow-md" : "cursor-default opacity-95",
        dragging && "opacity-40",
      )}
    >
      {plan.parentTitle && (
        <p className="mb-1 truncate text-xs text-gray-400">↑ {plan.parentTitle}</p>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenPlan(plan.id);
        }}
        className="block w-full text-left font-semibold text-gray-900 hover:text-brand-600"
      >
        {plan.title}
      </button>
      {plan.description && (
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{plan.description}</p>
      )}
      <div className="mt-2">
        <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {PLAN_TYPE_LABELS[plan.type] ?? plan.type}
        </span>
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
  dropTarget: KanbanColumnId | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (columnId: KanbanColumnId) => void;
  onDragLeave: () => void;
  onDrop: (columnId: KanbanColumnId, planId: string) => void;
  onOpenPlan: (planId: string) => void;
  onCreatePlan: () => void;
}) {
  const isTarget = dropTarget === columnId && draggingId !== null;

  return (
    <div
      className={cn(
        "flex min-h-[420px] min-w-[240px] flex-1 flex-col rounded-xl bg-gray-100/80 p-2 transition-colors",
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
        onDragEnd();
        if (planId) onDrop(columnId, planId);
      }}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">{plans.length}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {plans.map((plan) => (
          <PlanKanbanCard
            key={plan.id}
            plan={plan}
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
        className="mt-2 block w-full rounded-lg px-2 py-2 text-center text-sm text-gray-500 hover:bg-gray-200/60 hover:text-gray-800"
      >
        ＋ 新建计划或贡献
      </button>
    </div>
  );
}

export function PlanKanbanBoard({ initialPlans }: { initialPlans: KanbanPlan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<KanbanColumnId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [planModalId, setPlanModalId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const grouped = useMemo(() => groupPlansByKanbanColumn(plans), [plans]);

  const reloadPlans = useCallback(async () => {
    const data = await apiJson<{ plans?: KanbanPlan[] }>("/api/plans");
    setPlans(data.plans ?? []);
  }, []);

  useEffect(() => {
    function onPlanUpdated() {
      void reloadPlans();
    }
    window.addEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
    return () => window.removeEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
  }, [reloadPlans]);

  const movePlan = useCallback(
    async (planId: string, targetColumn: KanbanColumnId) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      const currentColumn = kanbanColumnForPlan(plan);
      if (currentColumn === targetColumn) return;

      if (!kanbanCanDrag(plan)) {
        setError(ROLLUP_STATUS_HINT);
        return;
      }

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
        if (!res.ok) {
          throw new Error(data.error ?? "更新失败");
        }
        await reloadPlans();
        dispatchPlanUpdated();
      } catch (e) {
        setPlans(prevPlans);
        setError(e instanceof Error ? e.message : "更新失败");
      } finally {
        setMoving(false);
      }
    },
    [plans, reloadPlans],
  );

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div>
        <p className="text-sm text-gray-500">
          与备忘录、甘特图共用同一份计划数据。无日期计划显示在「无状态」；拖入其他列会自动设置状态，并在需要时补上开始时间以进入甘特图。
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-2",
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
            onDrop={(columnId, planId) => {
              void movePlan(planId, columnId);
            }}
            onOpenPlan={setPlanModalId}
            onCreatePlan={() => setComposeOpen(true)}
          />
        ))}
      </div>

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
