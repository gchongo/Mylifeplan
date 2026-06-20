"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { formatFeedSummary } from "@/lib/services/feed";
import type { FeedActionType, FeedItemType } from "@prisma/client";

interface FeedRow {
  id: string;
  itemType: FeedItemType;
  itemId: string;
  actionType: FeedActionType;
  content: string | null;
  createdAt: string;
}

function feedHref(item: FeedRow): string | null {
  if (item.itemType === "task") return `/tasks/${item.itemId}`;
  if (item.itemType === "plan") return `/plans/${item.itemId}`;
  return null;
}

export function FeedPanelLive() {
  const [items, setItems] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const load = useCallback(async (cursor?: string | null, append = false) => {
    const qs = cursor ? `?cursor=${cursor}&limit=20` : "?limit=20";
    const res = await fetch(`/api/feed${qs}`);
    const data = await res.json();
    const rows: FeedRow[] = data.items ?? [];
    setItems((prev) => (append ? [...prev, ...rows] : rows));
    setNextCursor(data.nextCursor ?? null);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
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

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>信息流 · 看动态</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        {loading && <Loading />}
        {!loading && items.length === 0 && (
          <EmptyState title="暂无动态" description="创建任务或计划后，操作会显示在这里。" />
        )}
        {!loading && items.length > 0 && (
          <>
            <ul className="min-h-0 flex-1 space-y-3 overflow-auto">
              {items.map((item) => {
                const href = feedHref(item);
                const summary = formatFeedSummary(item.itemType, item.actionType, item.content);
                return (
                  <li
                    key={item.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                  >
                    {href ? (
                      <Link href={href} className="font-medium text-gray-900 hover:text-brand-600">
                        {summary}
                      </Link>
                    ) : (
                      <p className="font-medium text-gray-900">{summary}</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </li>
                );
              })}
            </ul>
            {nextCursor && (
              <Button
                className="mt-3 w-full"
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
