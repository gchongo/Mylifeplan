import { getQueryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";

type InvalidatePlanViewsOptions = {
  /** false = 只标记 stale，不立刻 refetch（已有 plan 快照写入缓存时用） */
  refetch?: boolean;
};

/** 计划变更后：刷新各视图数据 */
export function invalidatePlanViews(options?: InvalidatePlanViewsOptions) {
  const refetchType = options?.refetch === false ? "none" : "active";
  const qc = getQueryClient();
  void qc.invalidateQueries({ queryKey: queryKeys.plans.all, refetchType });
  void qc.invalidateQueries({ queryKey: queryKeys.gantt.all, refetchType });
  void qc.invalidateQueries({ queryKey: queryKeys.calendar.all, refetchType });
  void qc.invalidateQueries({ queryKey: queryKeys.feed.all });
  void qc.invalidateQueries({ queryKey: queryKeys.summary.all });
}

/** 便签变更后：便签板 + 信息流自动 refetch */
export function invalidateMemoViews() {
  const qc = getQueryClient();
  void qc.invalidateQueries({ queryKey: queryKeys.memos.all });
  void qc.invalidateQueries({ queryKey: queryKeys.feed.all });
}
