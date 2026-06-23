"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import {
  DonutChart,
  HorizontalBars,
  PrimaryPlanStats,
  usePlanSummary,
} from "@/components/summary/summary-widgets";
import type { PlanSummaryStats } from "@/lib/plan-summary";
import { cn } from "@/lib/utils";

function SummaryChartsRow({ summary }: { summary: PlanSummaryStats }) {
  const barsRef = useRef<HTMLDivElement>(null);
  const [donutSize, setDonutSize] = useState(88);

  useLayoutEffect(() => {
    const el = barsRef.current;
    if (!el) return;

    const update = () => {
      const h = el.clientHeight;
      if (h > 0) setDonutSize(Math.max(72, Math.min(112, h)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [summary.executionSegments.length, summary.statusSegments.length]);

  const strokeWidth = Math.max(10, Math.round(donutSize * 0.14));

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 rounded-lg border border-gray-100 bg-white/60 p-2 dark:border-gray-800 dark:bg-gray-900/40">
      <p className="text-[10px] font-medium text-gray-500">状态分布</p>
      <p className="text-[10px] font-medium text-gray-500">执行情况</p>

      <div className="flex items-center justify-center self-center">
        <DonutChart
          segments={summary.statusSegments}
          size={donutSize}
          strokeWidth={strokeWidth}
          centerValue={`${summary.completionRate}%`}
          centerLabel="完成率"
          centerValueClassName={donutSize < 90 ? "text-xs" : "text-sm"}
        />
      </div>

      <div ref={barsRef} className="flex min-h-[72px] items-center self-stretch">
        {summary.executionSegments.length > 0 ? (
          <HorizontalBars segments={summary.executionSegments} dense className="w-full" />
        ) : (
          <p className="text-[10px] text-gray-400">暂无执行数据</p>
        )}
      </div>
    </div>
  );
}

export function SummaryPanelLive({ className }: { className?: string }) {
  const { summary, loading, error, reload } = usePlanSummary();

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden border-0 bg-transparent shadow-none",
        className,
      )}
    >
      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1 pb-2">
        <CardTitle className="min-w-0 truncate text-gray-900 dark:text-gray-100">
          总结 · 看全局
        </CardTitle>
        <PanelExpandButton href="/summary" label="总结" />
      </div>

      <CardContent className="min-h-0 flex-1 overflow-y-auto p-0 pr-0.5">
        {loading && <Loading label="加载…" className="py-6" />}
        {!loading && error && (
          <EmptyState
            title="加载失败"
            description={error}
            className="border-0 bg-transparent py-6"
            action={
              <button type="button" className="text-xs text-brand-600 hover:underline" onClick={reload}>
                重试
              </button>
            }
          />
        )}
        {!loading && !error && summary && (
          <div className="flex flex-col gap-2">
            <PrimaryPlanStats summary={summary} singleRow />

            <SummaryChartsRow summary={summary} />

            {summary.totals.plans === 0 && (
              <p className="text-center text-xs text-gray-400">创建计划后这里会显示统计</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
