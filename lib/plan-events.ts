import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";
import { applyPlanUpdateToCache } from "@/lib/query/apply-plan-update";
import { invalidatePlanViews } from "@/lib/query/invalidate";

export type PlanUpdatedDetail = {
  plan?: SerializedPlanForGantt | Record<string, unknown>;
};

/**
 * 计划保存成功后：
 * 1. 有 plan 快照 → 立刻写入甘特/看板/日历缓存（即时 UI）
 * 2. 再 refetch 活跃 query（与信息流一致，后台校正）
 */
export function dispatchPlanUpdated(detail?: PlanUpdatedDetail) {
  if (detail?.plan) {
    applyPlanUpdateToCache(detail.plan as Record<string, unknown>);
  }
  invalidatePlanViews();
}
