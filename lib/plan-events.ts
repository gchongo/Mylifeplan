import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";
import { applyPlanUpdateToCache } from "@/lib/query/apply-plan-update";
import { invalidatePlanViews } from "@/lib/query/invalidate";

export type PlanUpdatedDetail = {
  plan?: SerializedPlanForGantt | Record<string, unknown>;
};

/** 任意计划保存成功后调用：有 plan 快照则立刻写缓存，否则触发 refetch */
export function dispatchPlanUpdated(detail?: PlanUpdatedDetail) {
  if (detail?.plan) {
    applyPlanUpdateToCache(detail.plan as Record<string, unknown>);
    invalidatePlanViews({ refetch: false });
    return;
  }
  invalidatePlanViews();
}
