"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { formatFeedSummary } from "@/lib/services/feed";
import type { FeedActionType, FeedItemType } from "@prisma/client";

interface FeedRow {
  id: string;
  itemType: FeedItemType;
  actionType: FeedActionType;
  content: string | null;
  createdAt: string;
}

export function FeedPanelLive() {
  const [items, setItems] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>信息流 · 看动态</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {loading && <Loading />}
        {!loading && items.length === 0 && (
          <EmptyState title="暂无动态" description="创建任务或计划后，操作会显示在这里。" />
        )}
        {!loading && items.length > 0 && (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
              >
                <p className="font-medium text-gray-900">
                  {formatFeedSummary(item.itemType, item.actionType, item.content)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString("zh-CN")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
