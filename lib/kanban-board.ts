import { shouldShowInMemo } from "@/lib/content-router";
import { toDatetimeLocalInput } from "@/lib/dates";
import { deriveStatusFromDirectChildren } from "@/lib/services/plan-rollup";
import type { PlanStatus, PlanType } from "@/types";

export type KanbanColumnId = "unscheduled" | "not_started" | "in_progress" | "done";

export const KANBAN_COLUMNS: { id: KanbanColumnId; label: string }[] = [
  { id: "unscheduled", label: "无状态" },
  { id: "not_started", label: "未开始" },
  { id: "in_progress", label: "进行中" },
  { id: "done", label: "已完成" },
];

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  goal: "目标",
  phase: "阶段",
  weekly: "周计划",
  daily: "日计划",
};

export interface KanbanPlan {
  id: string;
  title: string;
  description: string | null;
  type: PlanType;
  status: PlanStatus;
  startDate: string | null;
  endDate: string | null;
  parentPlanId: string | null;
  parentTitle: string | null;
  childStatuses: PlanStatus[];
  contributionCount: number;
}

export const UNSCHEDULED_BLOCKED_HINT =
  "该计划已有执行贡献，无法移入「无状态」。请保留排期，或拖到「已完成」归档。";

export function kanbanCanMoveToUnscheduled(plan: KanbanPlan): boolean {
  return plan.contributionCount === 0;
}

export function kanbanEffectiveStatus(plan: KanbanPlan): PlanStatus {
  if (plan.childStatuses.length > 0) {
    return deriveStatusFromDirectChildren(plan.childStatuses) ?? plan.status;
  }
  return plan.status;
}

export function kanbanColumnForPlan(plan: KanbanPlan): KanbanColumnId {
  const status = kanbanEffectiveStatus(plan);
  if (status === "done") return "done";
  if (shouldShowInMemo({ startDate: plan.startDate, endDate: plan.endDate })) {
    return "unscheduled";
  }
  if (status === "in_progress") return "in_progress";
  return "not_started";
}

export function kanbanCanDrag(plan: KanbanPlan): boolean {
  return plan.childStatuses.length === 0;
}

export function kanbanPatchForColumn(
  columnId: KanbanColumnId,
  plan: KanbanPlan,
): { status: PlanStatus; startDate?: string | null; endDate?: string | null } {
  if (columnId === "unscheduled" && !kanbanCanMoveToUnscheduled(plan)) {
    throw new Error(UNSCHEDULED_BLOCKED_HINT);
  }
  switch (columnId) {
    case "unscheduled":
      return { status: "not_started", startDate: null, endDate: null };
    case "not_started":
      return {
        status: "not_started",
        ...(plan.startDate ? {} : { startDate: toDatetimeLocalInput(new Date()) }),
      };
    case "in_progress":
      return {
        status: "in_progress",
        ...(plan.startDate ? {} : { startDate: toDatetimeLocalInput(new Date()) }),
      };
    case "done":
      return { status: "done" };
  }
}

export function groupPlansByKanbanColumn(plans: KanbanPlan[]): Record<KanbanColumnId, KanbanPlan[]> {
  const groups: Record<KanbanColumnId, KanbanPlan[]> = {
    unscheduled: [],
    not_started: [],
    in_progress: [],
    done: [],
  };
  for (const plan of plans) {
    groups[kanbanColumnForPlan(plan)].push(plan);
  }
  return groups;
}
