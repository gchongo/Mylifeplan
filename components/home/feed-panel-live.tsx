"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedTypeFilter } from "@/components/feed/feed-type-filter";
import { FeedItemCard } from "@/components/feed/feed-item-card";
import { ContributionDetailModal } from "@/components/contributions/contribution-detail-modal";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import type { FeedTypeFilter as FeedTypeFilterId } from "@/lib/feed-filters";
import type { FeedActionType, FeedItemType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { apiJson } from "@/lib/client-api";

interface FeedRow {
  id: string;
  itemType: FeedItemType;
  itemId: string;
  actionType: FeedActionType;
  content: string | null;
  createdAt: string;
  headline: string;
  excerpt: string | null;
  contextLabel: string | null;
  actionPhrase: string;
  planUpdateSummary: string | null;
}

export function FeedPanelLive({
  fullPage = false,
  className,
}: {
  fullPage?: boolean;
  className?: string;
}) {
  const pageSize = fullPage ? 50 : 20;
  const [items, setItems] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<FeedTypeFilterId>("all");
  const [contributionModalId, setContributionModalId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const loadMoreRef = useRef<HTMLLIElement>(null);

  const load = useCallback(
    async (
      cursor?: string | null,
      append = false,
      filter: FeedTypeFilterId = typeFilter,
    ) => {
      const params = new URLSearchParams({ limit: String(pageSize) });
      if (cursor) params.set("cursor", cursor);
      if (filter !== "all") params.set("itemType", filter);
      const data = await apiJson<{ items?: FeedRow[]; nextCursor?: string | null }>(
        `/api/feed?${params.toString()}`,
      );
      const rows: FeedRow[] = data.items ?? [];
      setItems((prev) => (append ? [...prev, ...rows] : rows));
      setNextCursor(data.nextCursor ?? null);
    },
    [pageSize, typeFilter],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await load(nextCursor, true);
    } finally {
      setLoadingMore(false);
    }
  }, [load, loadingMore, nextCursor]);

  useEffect(() => {
    setLoading(true);
    load(null, false, typeFilter)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [load, typeFilter]);

  useEffect(() => {
    const root = listRef.current;
    const sentinel = loadMoreRef.current;
    if (!root || !sentinel || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { root, rootMargin: "120px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length, nextCursor, loadMore]);

  function refreshFeed() {
    setLoading(true);
    load(null, false, typeFilter).finally(() => setLoading(false));
  }

  const emptyDescription =
    typeFilter === "all"
      ? "在上方发表框选择便签、计划或贡献后发布。"
      : typeFilter === "plan"
        ? "暂无计划相关动态，创建或更新计划后会显示在这里。"
        : typeFilter === "memo"
          ? "暂无便签相关动态，发布便签后会显示在这里。"
          : "暂无贡献相关动态，记录贡献后会显示在这里。";

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden border-0 bg-transparent shadow-none",
        !fullPage && "rounded-none",
        className,
      )}
    >
      {!fullPage && (
        <CardHeader className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 space-y-0 pb-2">
          <CardTitle className="min-w-0 truncate text-gray-900">信息流 · 看动态</CardTitle>
          <PanelExpandButton href="/feed" label="信息流" />
        </CardHeader>
      )}

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-0">
        <FeedComposer onPublished={refreshFeed} />
        <FeedTypeFilter value={typeFilter} onChange={setTypeFilter} />

        {loading && <Loading label="加载动态…" />}
        {!loading && items.length === 0 && (
          <EmptyState title="暂无动态" description={emptyDescription} />
        )}

        {!loading && items.length > 0 && (
          <>
            <ul
              ref={listRef}
              className={cn(
                "feed-item-list scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5",
                typeFilter === "contribution" ? "space-y-0 px-1" : "space-y-3",
                fullPage && typeFilter !== "contribution" && "space-y-4",
              )}
            >
              {items.map((item) => (
                <li key={item.id}>
                  <FeedItemCard
                    item={item}
                    logStyle={item.itemType === "contribution"}
                    onContributionClick={(id) => setContributionModalId(id)}
                  />
                </li>
              ))}
              {nextCursor && <li ref={loadMoreRef} className="h-1 shrink-0" aria-hidden />}
            </ul>
            <ContributionDetailModal
              contributionId={contributionModalId}
              open={contributionModalId !== null}
              onClose={() => setContributionModalId(null)}
              onChanged={refreshFeed}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
