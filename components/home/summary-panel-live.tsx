"use client";

import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import {
  DonutChart,
  HorizontalBars,
  Legend,
  MiniStat,
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
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-1.5">
              <MiniStat label="进行中" value={summary.byStatus.in_progress} color="#3b82f6" />
              <MiniStat label="已完成" value={summary.byStatus.done} color="#22c55e" />
              <MiniStat label="未开始" value={summary.byStatus.not_started} color="#f59e0b" />
              <MiniStat label="超截止" value={summary.execution.deadlineOverdue} color="#ef4444" />
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white/60 p-2 dark:border-gray-800 dark:bg-gray-900/40">
              <DonutChart
                segments={summary.statusSegments}
                size={88}
                strokeWidth={14}
                centerValue={`${summary.completionRate}%`}
                centerLabel="完成率"
                centerValueClassName="text-sm"
              />
              <div className="min-w-0 flex-1 pt-1">
                <Legend segments={summary.statusSegments} dense />
              </div>
            </div>

            {summary.executionSegments.length > 0 && (
              <div className="rounded-lg border border-gray-100 bg-white/60 p-2 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="mb-1.5 text-[10px] font-medium text-gray-500">执行情况</p>
                <HorizontalBars segments={summary.executionSegments.slice(0, 5)} dense />
              </div>
            )}

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <MiniStat label="计划" value={summary.totals.active} />
              <MiniStat label="便签" value={summary.totals.memos} />
              <MiniStat label="贡献" value={summary.totals.contributions} />
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
