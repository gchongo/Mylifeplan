import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";
import { applyPlanUpdateToCache } from "@/lib/query/apply-plan-update";
import { invalidatePlanViews } from "@/lib/query/invalidate";

export type PlanUpdatedDetail = {
  plan?: SerializedPlanForGantt | Record<string, unknown>;
};

type DispatchPlanUpdatedOptions = {
  /** 看板拖放等已在 applyPlanUpdateToCache 写入 plans 时使用 */
  skipPlansRefetch?: boolean;
};

/**
 * 计划保存成功后：
 * 1. 有 plan 快照 → 立刻写入甘特/看板/日历缓存（即时 UI）
 * 2. 再 refetch 其它活跃 query（甘特/日历/feed 等）
 */
export function dispatchPlanUpdated(
  detail?: PlanUpdatedDetail,
  options?: DispatchPlanUpdatedOptions,
) {
  if (detail?.plan) {
    applyPlanUpdateToCache(detail.plan as Record<string, unknown>);
  }
  invalidatePlanViews({ skipPlans: options?.skipPlansRefetch });
}
