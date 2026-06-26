import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";
import { applyPlanUpdateToCache } from "@/lib/query/apply-plan-update";
import { invalidateAuxiliaryPlanViews, invalidatePlanViews } from "@/lib/query/invalidate";

export type PlanUpdatedDetail = {
  plan?: SerializedPlanForGantt | Record<string, unknown>;
};

/**
 * 计划保存成功后：
 * 1. 有 plan 快照 → 立刻写入看板/甘特/日历缓存，且不再 refetch 这些视图（避免旧 API 覆盖）
 * 2. 无快照 → 全量 refetch
 */
export function dispatchPlanUpdated(detail?: PlanUpdatedDetail) {
  if (detail?.plan) {
    applyPlanUpdateToCache(detail.plan as Record<string, unknown>);
    invalidateAuxiliaryPlanViews();
    return;
  }
  invalidatePlanViews();
}
