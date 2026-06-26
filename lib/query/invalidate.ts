import { getQueryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";

/** 计划变更后：刷新各已挂载视图（refetch 活跃的 query） */
export function invalidatePlanViews() {
  const qc = getQueryClient();
  void qc.invalidateQueries({ queryKey: queryKeys.plans.all });
  void qc.invalidateQueries({ queryKey: queryKeys.gantt.all });
  void qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
  void qc.invalidateQueries({ queryKey: queryKeys.feed.all });
  void qc.invalidateQueries({ queryKey: queryKeys.summary.all });
}

/** 已有 plan 快照并已 applyPlanUpdateToCache 时：只刷新无法即时 patch 的视图 */
export function invalidateAuxiliaryPlanViews() {
  const qc = getQueryClient();
  void qc.invalidateQueries({ queryKey: queryKeys.feed.all });
  void qc.invalidateQueries({ queryKey: queryKeys.summary.all });
}

/** 便签变更后：便签板 + 信息流自动 refetch */
export function invalidateMemoViews() {
  const qc = getQueryClient();
  void qc.invalidateQueries({ queryKey: queryKeys.memos.all });
  void qc.invalidateQueries({ queryKey: queryKeys.feed.all });
}
