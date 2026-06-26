import { getQueryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";

type InvalidatePlanViewsOptions = {
  /** 看板已在本地写入 server plan 时可跳过，避免 refetch/stale 覆盖乐观更新 */
  skipPlans?: boolean;
};

/** 计划变更后：刷新各已挂载视图（refetch 活跃的 query） */
export function invalidatePlanViews(options?: InvalidatePlanViewsOptions) {
  const qc = getQueryClient();
  if (!options?.skipPlans) {
    void qc.invalidateQueries({ queryKey: queryKeys.plans.all });
  }
  void qc.invalidateQueries({ queryKey: queryKeys.gantt.all });
  void qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
  void qc.invalidateQueries({ queryKey: queryKeys.feed.all });
  void qc.invalidateQueries({ queryKey: queryKeys.summary.all });
}

/** 便签变更后：便签板 + 信息流自动 refetch */
export function invalidateMemoViews() {
  const qc = getQueryClient();
  void qc.invalidateQueries({ queryKey: queryKeys.memos.all });
  void qc.invalidateQueries({ queryKey: queryKeys.feed.all });
}
