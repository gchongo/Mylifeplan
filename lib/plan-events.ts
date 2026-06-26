import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";
import { invalidatePlanViews } from "@/lib/query/invalidate";

export type PlanUpdatedDetail = {
  plan?: SerializedPlanForGantt;
};

/** 任意计划保存成功后调用，触发各视图通过 React Query 自动刷新 */
export function dispatchPlanUpdated(_detail?: PlanUpdatedDetail) {
  invalidatePlanViews();
}
