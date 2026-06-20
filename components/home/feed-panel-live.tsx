"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedItemCard, type FeedItemCardData } from "@/components/feed/feed-item-card";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
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

  const load = useCallback(
    async (cursor?: string | null, append = false) => {
      const qs = cursor ? `?cursor=${cursor}&limit=${pageSize}` : `?limit=${pageSize}`;
      const data = await apiJson<{ items?: FeedRow[]; nextCursor?: string | null }>(
        `/api/feed${qs}`,
      );
      const rows: FeedRow[] = data.items ?? [];
      setItems((prev) => (append ? [...prev, ...rows] : rows));
      setNextCursor(data.nextCursor ?? null);
    },
    [pageSize],
  );

  useEffect(() => {
    load().catch(() => setItems([])).finally(() => setLoading(false));
  }, [load]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      await load(nextCursor, true);
    } finally {
      setLoadingMore(false);
    }
  }

  function refreshFeed() {
    setLoading(true);
    load().finally(() => setLoading(false));
  }

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden border-0 bg-transparent shadow-none",
        !fullPage && "rounded-none",
        className,
      )}
    >
      <CardHeader className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 space-y-0 pb-2">
        <CardTitle className="min-w-0 truncate text-gray-900">
          {fullPage ? "信息流" : "信息流 · 看动态"}
        </CardTitle>
        {!fullPage && <PanelExpandButton href="/feed" label="信息流" />}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-0">
        <FeedComposer onPublished={refreshFeed} />

        {loading && <Loading label="加载动态…" />}
        {!loading && items.length === 0 && (
          <EmptyState
            title="暂无动态"
            description="在上方发表框选择备忘、计划或贡献后发布。"
          />
        )}

        {!loading && items.length > 0 && (
          <>
            <ul
              className={cn(
                "feed-item-list min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5",
                fullPage && "space-y-4",
              )}
            >
              {items.map((item) => (
                <li key={item.id}>
                  <FeedItemCard item={item as FeedItemCardData} />
                </li>
              ))}
            </ul>
            {nextCursor && (
              <Button
                className="shrink-0"
                variant="secondary"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "加载中…" : "加载更多"}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
