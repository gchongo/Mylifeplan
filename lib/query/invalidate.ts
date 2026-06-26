import { getQueryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";

/** 计划变更后：所有已挂载的计划相关页面自动 refetch */
export function invalidatePlanViews() {
  const qc = getQueryClient();
  void qc.invalidateQueries({ queryKey: queryKeys.plans.all });
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
