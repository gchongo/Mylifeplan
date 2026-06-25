import { dispatchMemoUpdated } from "@/lib/memo-events";
import { dispatchPlanUpdated } from "@/lib/plan-events";

export const APP_REFRESH_EVENT = "meridian:app-refresh";

/** 手动刷新：通知看板、甘特、日历、信息流、便签、总结等视图重新拉取数据 */
export function dispatchAppRefresh() {
  dispatchPlanUpdated();
  dispatchMemoUpdated();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(APP_REFRESH_EVENT));
  }
}
