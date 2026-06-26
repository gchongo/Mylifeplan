import { applyMemoRemoveFromCache, applyMemoUpsertToCache } from "@/lib/query/apply-memo-update";
import { invalidateAuxiliaryMemoViews, invalidateMemoViews } from "@/lib/query/invalidate";
import type { StickyNoteData } from "@/components/memos/sticky-note";

export type MemoUpdatedDetail = {
  memo?: StickyNoteData;
  removeId?: string;
};

/**
 * 便签变更后：
 * - 有 memo / removeId → 直接写缓存（便签板即时更新），只刷新 feed
 * - 无快照 → 兜底 refetch 便签列表 + feed
 */
export function dispatchMemoUpdated(detail?: MemoUpdatedDetail) {
  if (detail?.memo) {
    applyMemoUpsertToCache({ ...detail.memo });
    invalidateAuxiliaryMemoViews();
    return;
  }
  if (detail?.removeId) {
    applyMemoRemoveFromCache(detail.removeId);
    invalidateAuxiliaryMemoViews();
    return;
  }
  invalidateMemoViews();
}
