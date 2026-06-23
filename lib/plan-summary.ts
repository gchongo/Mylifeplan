import type { PlanStatus, PlanType } from "@prisma/client";
import { getEffectiveEndDate } from "@/lib/content-router";
import { formatPlanDateTime, parsePlanDateTime } from "@/lib/dates";
import { isPlanOverdue, type PlanOverdueNode } from "@/lib/gantt-plan-status";

export interface SummaryPlanRow {
  id: string;
  title: string;
  type: PlanType;
  status: PlanStatus;
  startDate: Date | null;
  endDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  parentPlanId: string | null;
}

export interface PlanSummaryStats {
  totals: {
    plans: number;
    active: number;
    memos: number;
    contributions: number;
  };
  byStatus: Record<PlanStatus, number>;
  byType: Record<PlanType, number>;
  execution: {
    deadlineOverdue: number;
    scheduleOverdue: number;
    earlyCompleted: number;
    lateCompleted: number;
    onTimeCompleted: number;
    inProgressOnTrack: number;
    unscheduled: number;
  };
  completionRate: number;
  statusSegments: { key: string; label: string; value: number; color: string }[];
  typeSegments: { key: string; label: string; value: number; color: string }[];
  executionSegments: { key: string; label: string; value: number; color: string }[];
  recentCompletions: { id: string; title: string; completedAt: string }[];
}

const STATUS_LABELS: Record<PlanStatus, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  done: "已完成",
  archived: "已归档",
};

const TYPE_LABELS: Record<PlanType, string> = {
  goal: "长期目标",
  phase: "阶段",
  weekly: "周计划",
  daily: "日计划",
};

const STATUS_COLORS: Record<PlanStatus, string> = {
  not_started: "#f59e0b",
  in_progress: "#3b82f6",
  done: "#22c55e",
  archived: "#9ca3af",
};

const TYPE_COLORS: Record<PlanType, string> = {
  goal: "#6366f1",
  phase: "#8b5cf6",
  weekly: "#06b6d4",
  daily: "#14b8a6",
};

function isActive(status: PlanStatus): boolean {
  return status !== "archived";
}

function isDone(status: PlanStatus): boolean {
  return status === "done";
}

function planEndIso(plan: SummaryPlanRow): string | null {
  return formatPlanDateTime(plan.endDate);
}

function planStartIso(plan: SummaryPlanRow): string | null {
  return formatPlanDateTime(plan.startDate);
}

export function isDeadlineOverdue(plan: SummaryPlanRow, now = new Date()): boolean {
  if (plan.status === "done" || plan.status === "archived") return false;
  const start = planStartIso(plan);
  const end = planEndIso(plan);
  const { effectiveEnd, isVirtualEnd } = getEffectiveEndDate(
    { startDate: start ?? undefined, endDate: end ?? undefined },
    now,
  );
  if (!effectiveEnd || isVirtualEnd) return false;
  const endMs = parsePlanDateTime(effectiveEnd)?.getTime();
  const nowMs = now.getTime();
  return endMs != null && endMs < nowMs;
}

export function isEarlyCompleted(plan: SummaryPlanRow): boolean {
  if (!isDone(plan.status) || !plan.actualEndDate || !plan.endDate) return false;
  return plan.actualEndDate.getTime() < plan.endDate.getTime();
}

export function isLateCompleted(plan: SummaryPlanRow): boolean {
  if (!isDone(plan.status) || !plan.actualEndDate || !plan.endDate) return false;
  return plan.actualEndDate.getTime() > plan.endDate.getTime();
}

export function isOnTimeCompleted(plan: SummaryPlanRow): boolean {
  if (!isDone(plan.status) || !plan.actualEndDate || !plan.endDate) return false;
  return plan.actualEndDate.getTime() <= plan.endDate.getTime();
}

function toOverdueNode(plan: SummaryPlanRow): PlanOverdueNode {
  const start = planStartIso(plan);
  const end = planEndIso(plan);
  const { isVirtualEnd } = getEffectiveEndDate({
    startDate: start ?? undefined,
    endDate: end ?? undefined,
  });
  return {
    status: plan.status,
    endDate: end,
    isVirtualEnd,
    parentId: plan.parentPlanId,
  };
}

export function computePlanSummary(
  plans: SummaryPlanRow[],
  extras: { memos: number; contributions: number },
  now = new Date(),
): PlanSummaryStats {
  const byStatus: Record<PlanStatus, number> = {
    not_started: 0,
    in_progress: 0,
    done: 0,
    archived: 0,
  };
  const byType: Record<PlanType, number> = {
    goal: 0,
    phase: 0,
    weekly: 0,
    daily: 0,
  };

  const execution = {
    deadlineOverdue: 0,
    scheduleOverdue: 0,
    earlyCompleted: 0,
    lateCompleted: 0,
    onTimeCompleted: 0,
    inProgressOnTrack: 0,
    unscheduled: 0,
  };

  const planById = new Map<string, PlanOverdueNode>();
  for (const plan of plans) {
    planById.set(plan.id, toOverdueNode(plan));
  }

  const activePlans = plans.filter((p) => isActive(p.status));

  for (const plan of plans) {
    byStatus[plan.status] += 1;
    byType[plan.type] += 1;

    if (isPlanOverdue(toOverdueNode(plan), planById)) {
      execution.scheduleOverdue += 1;
    }

    if (isDeadlineOverdue(plan, now)) {
      execution.deadlineOverdue += 1;
    }

    if (isEarlyCompleted(plan)) {
      execution.earlyCompleted += 1;
    } else if (isLateCompleted(plan)) {
      execution.lateCompleted += 1;
    } else if (isOnTimeCompleted(plan)) {
      execution.onTimeCompleted += 1;
    }

    if (plan.status === "in_progress" && !isDeadlineOverdue(plan, now)) {
      execution.inProgressOnTrack += 1;
    }

    if (isActive(plan.status) && !planStartIso(plan) && !planEndIso(plan)) {
      execution.unscheduled += 1;
    }
  }

  const doneCount = byStatus.done;
  const completionRate =
    activePlans.length > 0 ? Math.round((doneCount / activePlans.length) * 100) : 0;

  const statusSegments = (["not_started", "in_progress", "done", "archived"] as PlanStatus[])
    .map((key) => ({
      key,
      label: STATUS_LABELS[key],
      value: byStatus[key],
      color: STATUS_COLORS[key],
    }))
    .filter((s) => s.value > 0);

  const typeSegments = (["goal", "phase", "weekly", "daily"] as PlanType[])
    .map((key) => ({
      key,
      label: TYPE_LABELS[key],
      value: byType[key],
      color: TYPE_COLORS[key],
    }))
    .filter((s) => s.value > 0);

  const executionSegments = [
    { key: "early", label: "提前完成", value: execution.earlyCompleted, color: "#10b981" },
    { key: "onTime", label: "按时完成", value: execution.onTimeCompleted, color: "#22c55e" },
    { key: "late", label: "延期完成", value: execution.lateCompleted, color: "#f97316" },
    { key: "deadline", label: "已超截止", value: execution.deadlineOverdue, color: "#ef4444" },
    { key: "schedule", label: "超出父计划", value: execution.scheduleOverdue, color: "#dc2626" },
    { key: "onTrack", label: "进行中正常", value: execution.inProgressOnTrack, color: "#3b82f6" },
    { key: "unscheduled", label: "未排期", value: execution.unscheduled, color: "#a78bfa" },
  ].filter((s) => s.value > 0);

  const recentCompletions = plans
    .filter((p) => isDone(p.status) && p.actualEndDate)
    .sort((a, b) => (b.actualEndDate!.getTime() - a.actualEndDate!.getTime()))
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      title: p.title,
      completedAt: formatPlanDateTime(p.actualEndDate)!,
    }));

  return {
    totals: {
      plans: plans.length,
      active: activePlans.length,
      memos: extras.memos,
      contributions: extras.contributions,
    },
    byStatus,
    byType,
    execution,
    completionRate,
    statusSegments,
    typeSegments,
    executionSegments,
    recentCompletions,
  };
}
