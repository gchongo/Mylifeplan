import type { KanbanPlan } from "@/lib/kanban-board";
import { apiJson } from "@/lib/client-api";
import {
  normalizeSchedulePatchForApi,
  type ScheduleTransitionPatch,
} from "@/lib/plan-schedule-transition";
import type { PlanStatus } from "@/types";

/** 看板拖放/恢复时的乐观更新：字段与 API 返回格式一致（ISO 日期） */
export function applyOptimisticKanbanPatch(
  plans: KanbanPlan[],
  planId: string,
  patch: ScheduleTransitionPatch,
): KanbanPlan[] {
  const body = normalizeSchedulePatchForApi(patch);
  return plans.map((p) => {
    if (p.id !== planId) return p;
    return {
      ...p,
      status: (body.status as PlanStatus) ?? p.status,
      startDate: "startDate" in body ? (body.startDate as string | null) : p.startDate,
      endDate: "endDate" in body ? (body.endDate as string | null) : p.endDate,
    };
  });
}

export async function patchKanbanPlan(
  planId: string,
  patch: ScheduleTransitionPatch,
): Promise<{ plan?: Record<string, unknown>; error?: string }> {
  const body = normalizeSchedulePatchForApi(patch);
  try {
    const data = await apiJson<{ plan?: Record<string, unknown>; error?: string }>(
      `/api/plans/${planId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    return { plan: data.plan };
  } catch (e) {
    return { error: e instanceof Error ? e.message : undefined };
  }
}
