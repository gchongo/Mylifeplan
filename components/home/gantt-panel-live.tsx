"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import type { GanttItem } from "@/types";

function dateToMs(d: string) {
  return new Date(d + "T00:00:00.000Z").getTime();
}

function formatShort(d: string) {
  return d.slice(5).replace("-", "/");
}

export function GanttPanelLive() {
  const [items, setItems] = useState<GanttItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gantt")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const { rangeStart, rangeEnd, rangeMs } = useMemo(() => {
    if (items.length === 0) {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 3, 0));
      return {
        rangeStart: start.toISOString().slice(0, 10),
        rangeEnd: end.toISOString().slice(0, 10),
        rangeMs: end.getTime() - start.getTime(),
      };
    }
    let min = dateToMs(items[0].startDate);
    let max = dateToMs(items[0].effectiveEnd);
    for (const item of items) {
      min = Math.min(min, dateToMs(item.startDate));
      max = Math.max(max, dateToMs(item.effectiveEnd));
    }
    const pad = 7 * 24 * 3600 * 1000;
    min -= pad;
    max += pad;
    return {
      rangeStart: new Date(min).toISOString().slice(0, 10),
      rangeEnd: new Date(max).toISOString().slice(0, 10),
      rangeMs: max - min,
    };
  }, [items]);

  const rangeStartMs = dateToMs(rangeStart);

  function barStyle(item: GanttItem) {
    const left = ((dateToMs(item.startDate) - rangeStartMs) / rangeMs) * 100;
    const width =
      ((dateToMs(item.effectiveEnd) - dateToMs(item.startDate)) / rangeMs) * 100;
    return {
      left: `${Math.max(0, Math.min(left, 100))}%`,
      width: `${Math.max(2, Math.min(width, 100 - left))}%`,
    };
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>甘特图 · 看全局</CardTitle>
        <Badge variant="info">虚线 = 预估截止</Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        {loading && <Loading />}
        {!loading && items.length === 0 && (
          <EmptyState
            title="暂无时间条"
            description="创建带开始日期的任务或计划后，会在此展示。"
          />
        )}
        {!loading && items.length > 0 && (
          <>
            <div className="mb-2 flex justify-between text-xs text-gray-400">
              <span>{formatShort(rangeStart)}</span>
              <span>{formatShort(rangeEnd)}</span>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="group">
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span
                      className={
                        item.type === "task" ? "text-brand-600" : "text-purple-600"
                      }
                    >
                      {item.type === "task" ? "任务" : "计划"}
                    </span>
                    <Link
                      href={item.type === "task" ? `/tasks/${item.id}` : `/plans/${item.id}`}
                      className="truncate font-medium text-gray-800 hover:text-brand-600"
                    >
                      {item.title}
                    </Link>
                    {item.isVirtualEnd && (
                      <Badge variant="warning" className="shrink-0">
                        预估
                      </Badge>
                    )}
                  </div>
                  <div className="relative h-6 rounded bg-gray-100">
                    <div
                      className={`absolute top-1 h-4 rounded ${
                        item.type === "task" ? "bg-brand-500/80" : "bg-purple-500/80"
                      } ${item.isVirtualEnd ? "border-2 border-dashed border-amber-500 bg-brand-500/30" : ""}`}
                      style={barStyle(item)}
                      title={`${item.startDate} → ${item.effectiveEnd}`}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {item.startDate} → {item.effectiveEnd}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
