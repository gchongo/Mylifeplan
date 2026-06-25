"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { PLAN_UPDATED_EVENT, planDataVersion } from "@/lib/plan-events";
import { MEMO_UPDATED_EVENT, memoDataVersion } from "@/lib/memo-events";

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

export function FeedPanelLive({
  fullPage = false,
  className,
}: {
  fullPage?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const pageSize = fullPage ? 50 : 20;
  const [items, setItems] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<FeedTypeFilterId>("all");
  const listRef = useRef<HTMLUListElement>(null);
  const loadMoreRef = useRef<HTMLLIElement>(null);
  const planSyncedVersionRef = useRef(planDataVersion);
  const memoSyncedVersionRef = useRef(memoDataVersion);

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
    const sentinel = loadMoreRef.current;
    if (!sentinel || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
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
  }, [fullPage, items.length, nextCursor, loadMore]);

  const refreshFeed = useCallback(
    (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      load(null, false, typeFilter).finally(() => {
        if (!opts?.silent) setLoading(false);
      });
    },
    [load, typeFilter],
  );

  useEffect(() => {
    function onPlanUpdated(event: Event) {
      const detail = (event as CustomEvent<{ version?: number }>).detail;
      planSyncedVersionRef.current = detail?.version ?? planDataVersion;
      refreshFeed({ silent: true });
    }

    function onMemoUpdated(event: Event) {
      const detail = (event as CustomEvent<{ version?: number }>).detail;
      memoSyncedVersionRef.current = detail?.version ?? memoDataVersion;
      refreshFeed({ silent: true });
    }

    function syncIfStale() {
      if (document.visibilityState !== "visible") return;
      let stale = false;
      if (planDataVersion > planSyncedVersionRef.current) {
        planSyncedVersionRef.current = planDataVersion;
        stale = true;
      }
      if (memoDataVersion > memoSyncedVersionRef.current) {
        memoSyncedVersionRef.current = memoDataVersion;
        stale = true;
      }
      if (stale) refreshFeed({ silent: true });
    }

    window.addEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
    window.addEventListener(MEMO_UPDATED_EVENT, onMemoUpdated);
    document.addEventListener("visibilitychange", syncIfStale);
    syncIfStale();
    return () => {
      window.removeEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
      window.removeEventListener(MEMO_UPDATED_EVENT, onMemoUpdated);
      document.removeEventListener("visibilitychange", syncIfStale);
    };
  }, [refreshFeed]);

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
        <FeedComposer onPublished={refreshFeed} />
        <FeedTypeFilter value={typeFilter} onChange={setTypeFilter} />

        {loading && <Loading label={t("feed.loading")} />}
        {!loading && items.length === 0 && (
          <EmptyState title={t("feed.emptyTitle")} description={emptyDescription} />
        )}

        {!loading && items.length > 0 && (
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
                    onContributionChanged={refreshFeed}
                  />
                </li>
              ))}
              {nextCursor && <li ref={loadMoreRef} className="h-1 shrink-0" aria-hidden />}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
