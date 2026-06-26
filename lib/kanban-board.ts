import { isPlanUnscheduled } from "@/lib/content-router";
import { deriveStatusFromDirectChildren } from "@/lib/services/plan-rollup";
import type { VisualStatusKey } from "@/lib/task-status-style";
import { getKanbanColumnVisual } from "@/lib/task-status-style";
import {
  buildPlanScheduleTransitionPatch,
  type ScheduleTransitionPatch,
} from "@/lib/plan-schedule-transition";
import type { PlanStatus, PlanType } from "@/types";

export type KanbanColumnId = "unscheduled" | "not_started" | "in_progress" | "done";

export type KanbanDropZoneId = KanbanColumnId | "archived";

export const KANBAN_ARCHIVED_STORAGE_KEY = "meridian-kanban-archived-open";

/** 看板「未排期」列：无开始/结束时间，视觉与甘特「未排期」一致 */
export const KANBAN_COLUMNS: { id: KanbanColumnId; label: string }[] = [
  { id: "unscheduled", label: "未排期" },
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
  "该计划已有执行贡献，无法移入「未排期」。请保留排期，或拖到「已完成」。";

export function kanbanVisualForZone(zoneId: KanbanDropZoneId): VisualStatusKey {
  return getKanbanColumnVisual(zoneId);
}

export function kanbanVisualForColumn(columnId: KanbanColumnId): VisualStatusKey {
  return kanbanVisualForZone(columnId);
}

export function kanbanVisualForPlan(plan: KanbanPlan): VisualStatusKey {
  return kanbanVisualForColumn(kanbanColumnForPlan(plan));
}

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
  if (isPlanUnscheduled({ startDate: plan.startDate, endDate: plan.endDate })) {
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
): ScheduleTransitionPatch {
  return buildPlanScheduleTransitionPatch(plan, columnId);
}

export function kanbanArchivePatch(): { status: PlanStatus } {
  return { status: "archived" };
}

export function kanbanRestorePatch(
  targetColumn: KanbanColumnId,
  plan: KanbanPlan,
): ScheduleTransitionPatch {
  return buildPlanScheduleTransitionPatch({ ...plan, status: "not_started" }, targetColumn);
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
