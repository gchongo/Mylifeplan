import { getQueryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";

export type MemoCacheRecord = {
  id: string;
  title?: string;
  description?: string | null;
  body?: string | null;
  posX?: number | null;
  posY?: number | null;
  zIndex?: number;
  color?: string | null;
  quadrant?: string | null;
  width?: number | null;
  height?: number | null;
  updatedAt?: string;
};

/** 便签创建/更新后：直接写入 React Query 缓存，不 refetch 列表 */
export function applyMemoUpsertToCache(memo: MemoCacheRecord) {
  const qc = getQueryClient();
  qc.setQueryData<MemoCacheRecord[]>(queryKeys.memos.standalone, (prev = []) => {
    const idx = prev.findIndex((m) => m.id === memo.id);
    if (idx >= 0) {
      const next = [...prev];
      next[idx] = { ...next[idx], ...memo };
      return next;
    }
    return [memo, ...prev];
  });
}

export function applyMemoRemoveFromCache(memoId: string) {
  const qc = getQueryClient();
  qc.setQueryData<MemoCacheRecord[]>(queryKeys.memos.standalone, (prev = []) =>
    prev.filter((m) => m.id !== memoId),
  );
}
