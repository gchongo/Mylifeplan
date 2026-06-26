"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedTypeFilter } from "@/components/feed/feed-type-filter";
import { FeedItemCard } from "@/components/feed/feed-item-card";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import type { FeedTypeFilter as FeedTypeFilterId } from "@/lib/feed-filters";
import type { PlanFeedChangeItem } from "@/lib/plan-feed-change";
import type { FeedContributionDetail } from "@/lib/feed-enrich";
import type { FeedActionType, FeedItemType } from "@prisma/client";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { apiJson } from "@/lib/client-api";
import { queryKeys } from "@/lib/query/keys";

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
  planUpdateChanges: PlanFeedChangeItem[] | null;
  planUpdateSummary: string | null;
  memoQuadrant: string | null;
  memoQuadrantId: string | null;
  contributionDetail: FeedContributionDetail | null;
}

async function fetchFeedPage(
  filter: FeedTypeFilterId,
  limit: number,
  cursor: string | null,
) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  if (filter !== "all") params.set("itemType", filter);
  return apiJson<{ items?: FeedRow[]; nextCursor?: string | null }>(
    `/api/feed?${params.toString()}`,
  );
}

export function FeedPanelLive({
  fullPage = false,
  className,
}: {
  fullPage?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const pageSize = fullPage ? 50 : 20;
  const [typeFilter, setTypeFilter] = useState<FeedTypeFilterId>("all");
  const listRef = useRef<HTMLUListElement>(null);
  const loadMoreRef = useRef<HTMLLIElement>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.feed.list(typeFilter, pageSize),
    queryFn: ({ pageParam }) => fetchFeedPage(typeFilter, pageSize, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const items = data?.pages.flatMap((page) => page.items ?? []) ?? [];

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage();
        }
      },
      {
        root: fullPage ? null : listRef.current,
        rootMargin: "120px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fullPage, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const emptyDescription =
    typeFilter === "all"
      ? t("feed.emptyAll")
      : typeFilter === "plan"
        ? t("feed.emptyPlan")
        : typeFilter === "memo"
          ? t("feed.emptyMemo")
          : t("feed.emptyContribution");

  return (
    <Card
      className={cn(
        "flex min-w-0 max-w-full flex-col border-0 bg-transparent shadow-none",
        fullPage ? "w-full" : "h-full min-h-0 overflow-hidden",
        !fullPage && "rounded-none",
        className,
      )}
    >
      {!fullPage && (
        <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1 pb-2">
          <CardTitle className="min-w-0 truncate text-gray-900 dark:text-gray-100">{t("feed.homeTitle")}</CardTitle>
          <PanelExpandButton href="/feed" label={t("feed.expand")} />
        </div>
      )}

      <CardContent
        className={cn(
          "flex flex-col gap-3 p-0",
          !fullPage && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <FeedComposer onPublished={() => void refetch()} />
        <FeedTypeFilter value={typeFilter} onChange={setTypeFilter} />

        {isLoading && <Loading label={t("feed.loading")} />}
        {!isLoading && items.length === 0 && (
          <EmptyState title={t("feed.emptyTitle")} description={emptyDescription} />
        )}

        {!isLoading && items.length > 0 && (
          <>
            <ul
              ref={listRef}
              className={cn(
                "feed-item-list scrollbar-hide pr-0.5",
                fullPage
                  ? typeFilter === "contribution"
                    ? "space-y-0 px-1"
                    : "space-y-4"
                  : cn(
                      "min-h-0 flex-1 overflow-y-auto overscroll-contain",
                      typeFilter === "contribution" ? "space-y-0 px-1" : "space-y-3",
                    ),
              )}
            >
              {items.map((item) => (
                <li key={item.id}>
                  <FeedItemCard
                    item={item}
                    logStyle={!fullPage || item.itemType === "contribution"}
                    onContributionChanged={() => void refetch()}
                  />
                </li>
              ))}
              {hasNextPage && <li ref={loadMoreRef} className="h-1 shrink-0" aria-hidden />}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
