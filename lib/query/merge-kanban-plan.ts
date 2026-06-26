import type { KanbanPlan } from "@/lib/kanban-board";
import type { PlanStatus, PlanType } from "@/types";

/** 将 PATCH/POST 返回的 plan 合并进看板列表项（保留 childStatuses 等列表专用字段） */
export function mergeServerPlanIntoKanban(
  existing: KanbanPlan | undefined,
  server: Record<string, unknown>,
): KanbanPlan {
  const base = existing ?? {
    id: String(server.id),
    title: String(server.title ?? ""),
    description: (server.description as string | null) ?? null,
    type: (server.type as PlanType) ?? "goal",
    status: (server.status as PlanStatus) ?? "not_started",
    startDate: (server.startDate as string | null) ?? null,
    endDate: (server.endDate as string | null) ?? null,
    parentPlanId: (server.parentPlanId as string | null) ?? null,
    parentTitle: null,
    childStatuses: [],
    contributionCount: 0,
  };

  return {
    ...base,
    id: String(server.id),
    title: String(server.title ?? base.title),
    description: (server.description as string | null) ?? base.description,
    type: (server.type as PlanType) ?? base.type,
    status: (server.status as PlanStatus) ?? base.status,
    startDate: (server.startDate as string | null) ?? base.startDate,
    endDate: (server.endDate as string | null) ?? base.endDate,
    parentPlanId: (server.parentPlanId as string | null) ?? base.parentPlanId,
  };
}

export function upsertKanbanPlanInList(
  plans: KanbanPlan[],
  server: Record<string, unknown>,
): KanbanPlan[] {
  const id = String(server.id);
  const idx = plans.findIndex((p) => p.id === id);
  if (idx >= 0) {
    const next = [...plans];
    next[idx] = mergeServerPlanIntoKanban(plans[idx], server);
    return next;
  }
  return [mergeServerPlanIntoKanban(undefined, server), ...plans];
}
