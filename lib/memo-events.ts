import { invalidateMemoViews } from "@/lib/query/invalidate";

/** 任意便签保存成功后调用，触发便签板与信息流自动刷新 */
export function dispatchMemoUpdated() {
  invalidateMemoViews();
}
