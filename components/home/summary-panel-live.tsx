"use client";

import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import {
  DonutChart,
  HorizontalBars,
  PrimaryPlanStats,
  usePlanSummary,
} from "@/components/summary/summary-widgets";
import { cn } from "@/lib/utils";

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
          <div className="flex flex-col gap-2.5">
            <PrimaryPlanStats summary={summary} />

            <div className="flex items-start gap-2 rounded-lg border border-gray-100 bg-white/60 p-2 dark:border-gray-800 dark:bg-gray-900/40">
              <div className="shrink-0">
                <DonutChart
                  segments={summary.statusSegments}
                  size={84}
                  strokeWidth={13}
                  centerValue={`${summary.completionRate}%`}
                  centerLabel="完成率"
                  centerValueClassName="text-sm"
                />
                <p className="mt-0.5 text-center text-[9px] text-gray-400">状态分布</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[10px] font-medium text-gray-500">执行情况</p>
                {summary.executionSegments.length > 0 ? (
                  <HorizontalBars segments={summary.executionSegments} dense />
                ) : (
                  <p className="text-[10px] text-gray-400">暂无执行数据</p>
                )}
              </div>
            </div>

            {summary.recentCompletions.length > 0 && (
              <div className="rounded-lg border border-gray-100 bg-white/60 p-2 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="mb-1 text-[10px] font-medium text-gray-500">最近完成</p>
                <ul className="space-y-1">
                  {summary.recentCompletions.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                      <Link
                        href={`/plans/${item.id}`}
                        className="min-w-0 truncate text-[11px] text-gray-700 hover:text-brand-700 dark:text-gray-300"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.totals.plans === 0 && (
              <p className="text-center text-xs text-gray-400">创建计划后这里会显示统计</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
