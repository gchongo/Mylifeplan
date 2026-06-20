"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import type { GanttItem } from "@/types";
import { cn } from "@/lib/utils";

function dateToMs(d: string) {
  return new Date(d + "T00:00:00.000Z").getTime();
}

function formatShort(d: string) {
  return d.slice(5).replace("-", "/");
}

function defaultRange(fullPage: boolean) {
  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (fullPage ? 3 : 1), 1),
  );
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + (fullPage ? 6 : 3), 0),
  );
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function buildDepthMap(items: GanttItem[]) {
  const byKey = new Map(items.map((i) => [`${i.type}-${i.id}`, i]));
  const cache = new Map<string, number>();

  function depth(item: GanttItem): number {
    const key = `${item.type}-${item.id}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    if (!item.parentId) {
      cache.set(key, 0);
      return 0;
    }

    const parent =
      byKey.get(`task-${item.parentId}`) ?? byKey.get(`plan-${item.parentId}`);
    const d = parent ? depth(parent) + 1 : 0;
    cache.set(key, d);
    return d;
  }

  for (const item of items) depth(item);
  return cache;
}

export function GanttPanelLive({
  fullPage = false,
  className,
}: {
  fullPage?: boolean;
  className?: string;
}) {
  const initial = defaultRange(fullPage);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [items, setItems] = useState<GanttItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gantt?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, [from, to]);

  const depthMap = useMemo(() => buildDepthMap(items), [items]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = depthMap.get(`${a.type}-${a.id}`) ?? 0;
      const db = depthMap.get(`${b.type}-${b.id}`) ?? 0;
      if (da !== db) return da - db;
      return a.startDate.localeCompare(b.startDate);
    });
  }, [items, depthMap]);

  const { rangeStart, rangeEnd, rangeMs } = useMemo(() => {
    const startMs = dateToMs(from);
    const endMs = dateToMs(to);
    return {
      rangeStart: from,
      rangeEnd: to,
      rangeMs: Math.max(endMs - startMs, 1),
    };
  }, [from, to]);

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

  const barTrackClass = fullPage ? "h-10" : "h-6";
  const barFillClass = fullPage ? "top-1.5 h-7" : "top-1 h-4";

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CardTitle>{fullPage ? "甘特图" : "甘特图 · 看全局"}</CardTitle>
          <Badge variant="info">虚线 = 预估截止</Badge>
        </div>
        {!fullPage && <PanelExpandButton href="/gantt" label="甘特图" />}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <Input
            label="起始"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-auto min-w-[9rem]"
          />
          <Input
            label="截止"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-auto min-w-[9rem]"
          />
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={() => {
              const d = defaultRange(fullPage);
              setFrom(d.from);
              setTo(d.to);
            }}
          >
            重置范围
          </Button>
        </div>

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
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto pr-1",
                fullPage ? "space-y-3" : "space-y-2",
              )}
            >
              {sortedItems.map((item) => {
                const depth = depthMap.get(`${item.type}-${item.id}`) ?? 0;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="group"
                    style={{ paddingLeft: `${depth * (fullPage ? 24 : 16)}px` }}
                  >
                    <div
                      className={cn(
                        "mb-1 flex items-center gap-2",
                        fullPage ? "text-sm" : "text-xs",
                      )}
                    >
                      <span
                        className={
                          item.type === "task" ? "text-brand-600" : "text-purple-600"
                        }
                      >
                        {item.type === "task" ? "任务" : "计划"}
                      </span>
                      <Link
                        href={
                          item.type === "task" ? `/tasks/${item.id}` : `/plans/${item.id}`
                        }
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
                    <div className={cn("relative rounded bg-gray-100", barTrackClass)}>
                      <div
                        className={cn(
                          "absolute rounded",
                          barFillClass,
                          item.type === "task" ? "bg-brand-500/80" : "bg-purple-500/80",
                          item.isVirtualEnd &&
                            "border-2 border-dashed border-amber-500 bg-brand-500/30",
                        )}
                        style={barStyle(item)}
                        title={`${item.startDate} → ${item.effectiveEnd}`}
                      />
                    </div>
                    <p className={cn("mt-0.5 text-gray-400", fullPage ? "text-xs" : "text-[10px]")}>
                      {item.startDate} → {item.effectiveEnd}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
