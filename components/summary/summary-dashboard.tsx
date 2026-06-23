"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import {
  DonutChart,
  HorizontalBars,
  Legend,
  MiniStat,
  StatCard,
  usePlanSummary,
} from "@/components/summary/summary-widgets";
import { cn } from "@/lib/utils";

export function SummaryDashboard() {
  const { summary, loading, error, reload } = usePlanSummary();

  if (loading) return <Loading label="加载总结…" />;
  if (error) {
    return (
      <EmptyState
        title="加载失败"
        description={error}
        action={
          <button type="button" className="text-sm text-brand-600 hover:underline" onClick={reload}>
            重试
          </button>
        }
      />
    );
  }
  if (!summary) return <EmptyState title="暂无数据" description="创建计划后会在这里显示统计。" />;

  const { totals, byStatus, execution, completionRate } = summary;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">总结</h1>
        <p className="mt-1 text-sm text-gray-500">计划执行情况一览</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="计划总数" value={totals.plans} hint={`有效 ${totals.active}`} accentClass="bg-indigo-500" />
        <StatCard label="进行中" value={byStatus.in_progress} accentClass="bg-blue-500" />
        <StatCard label="已完成" value={byStatus.done} accentClass="bg-green-500" />
        <StatCard label="未开始" value={byStatus.not_started} accentClass="bg-amber-500" />
        <StatCard
          label="已超截止"
          value={execution.deadlineOverdue}
          hint="未完成且已过截止"
          accentClass="bg-red-500"
        />
        <StatCard
          label="提前完成"
          value={execution.earlyCompleted}
          hint="实际早于计划截止"
          accentClass="bg-emerald-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>状态分布</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
            <DonutChart
              segments={summary.statusSegments}
              centerValue={`${completionRate}%`}
              centerLabel="完成率"
            />
            <div className="w-full sm:max-w-[200px]">
              <Legend segments={summary.statusSegments} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>计划类型</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBars segments={summary.typeSegments} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>执行情况</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
            <div className="flex justify-center lg:justify-start">
              <DonutChart segments={summary.executionSegments} size={140} strokeWidth={18} />
            </div>
            <HorizontalBars segments={summary.executionSegments} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="便签" value={totals.memos} />
        <StatCard label="贡献记录" value={totals.contributions} />
        <StatCard label="已归档" value={byStatus.archived} accentClass="bg-gray-400" />
      </div>

      {summary.recentCompletions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近完成</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {summary.recentCompletions.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <Link
                    href={`/plans/${item.id}`}
                    className="min-w-0 truncate text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
                  >
                    {item.title}
                  </Link>
                  <time className="shrink-0 text-xs text-gray-400">
                    {new Date(item.completedAt).toLocaleString("zh-CN", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
