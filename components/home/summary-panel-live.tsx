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
    <div className="flex items-stretch gap-3 rounded-lg border border-gray-100 bg-white/60 p-2.5 dark:border-gray-800 dark:bg-gray-900/40">
      <div className="flex w-[38%] min-w-[5.5rem] max-w-[7.5rem] shrink-0 items-center justify-center self-center">
        <DonutChart
          segments={summary.statusSegments}
          size={donutSize}
          strokeWidth={strokeWidth}
          centerValue={`${summary.completionRate}%`}
          centerLabel="完成率"
          centerValueClassName={donutSize < 90 ? "text-xs" : "text-sm"}
        />
      </div>

      <div ref={barsRef} className="flex min-h-[72px] min-w-0 flex-1 items-center self-stretch border-l border-gray-100 py-0.5 pl-3 pr-3 dark:border-gray-800">
        {summary.executionSegments.length > 0 ? (
          <HorizontalBars
            segments={summary.executionSegments}
            dense
            barWidthScale={0.88}
            className="w-full"
          />
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
        "flex h-auto min-h-0 min-w-0 max-w-full flex-col overflow-hidden border-0 bg-transparent shadow-none",
        className,
      )}
    >
      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1 pb-2">
        <CardTitle className="min-w-0 truncate text-gray-900 dark:text-gray-100">
          总结 · 看全局
        </CardTitle>
        <PanelExpandButton href="/summary" label="总结" />
      </div>

      <CardContent className="shrink-0 overflow-hidden p-0">
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
