"use client";

import Link from "next/link";
import { EmptyState, Loading } from "@/components/ui/feedback";
import {
  DonutChart,
  IconHorizontalBars,
  IconLegend,
  IconMetricTile,
  PRIMARY_PLAN_STAT_ITEMS,
  SectionShell,
  getPrimaryPlanStatValue,
  usePlanSummary,
} from "@/components/summary/summary-widgets";
import {
  ExecutionIcon,
  IconArchived,
  IconContribution,
  IconDone,
  IconEarly,
  IconExecution,
  IconInProgress,
  IconMemo,
  IconNotStarted,
  IconOverdue,
  IconPlans,
  IconRecent,
  IconStatus,
  IconType,
  StatusIcon,
  TypeIcon,
  type ExecutionVariant,
} from "@/components/summary/summary-icons";
import type { PlanStatus, PlanType } from "@/types";

const PRIMARY_ICONS = {
  total: IconPlans,
  in_progress: IconInProgress,
  done: IconDone,
  not_started: IconNotStarted,
  deadlineOverdue: IconOverdue,
  earlyCompleted: IconEarly,
} as const;

const PRIMARY_ACCENTS: Record<(typeof PRIMARY_PLAN_STAT_ITEMS)[number]["key"], string> = {
  total: "#6366f1",
  in_progress: "#3b82f6",
  done: "#22c55e",
  not_started: "#f59e0b",
  deadlineOverdue: "#ef4444",
  earlyCompleted: "#10b981",
};

function formatCompletionTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

  const { totals, byStatus } = summary;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-6">
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-indigo-50/90 via-white to-cyan-50/60 p-5 shadow-sm dark:border-gray-800 dark:from-indigo-950/30 dark:via-gray-900 dark:to-cyan-950/20 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex shrink-0 justify-center lg:justify-start">
            <DonutChart
              segments={summary.statusSegments}
              size={148}
              strokeWidth={20}
              centerValue={`${summary.completionRate}%`}
              centerValueClassName="text-3xl"
            />
          </div>

          <div className="grid flex-1 grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {PRIMARY_PLAN_STAT_ITEMS.map((item) => {
              const Icon = PRIMARY_ICONS[item.key];
              return (
                <IconMetricTile
                  key={item.key}
                  title={item.label}
                  value={getPrimaryPlanStatValue(summary, item.key)}
                  accent={PRIMARY_ACCENTS[item.key]}
                  icon={<Icon className="h-5 w-5 text-white" />}
                />
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionShell icon={<IconStatus className="h-4 w-4" />} title="状态分布">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-between">
            <DonutChart segments={summary.statusSegments} size={132} strokeWidth={18} />
            <div className="w-full sm:max-w-[220px]">
              <IconLegend
                segments={summary.statusSegments}
                renderIcon={(seg) => (
                  <StatusIcon
                    status={(seg.key ?? "not_started") as PlanStatus}
                    className="h-4 w-4"
                  />
                )}
              />
            </div>
          </div>
        </SectionShell>

        <SectionShell icon={<IconType className="h-4 w-4" />} title="计划类型">
          <IconHorizontalBars
            segments={summary.typeSegments}
            renderIcon={(seg) => (
              <TypeIcon type={(seg.key ?? "goal") as PlanType} className="h-4 w-4" />
            )}
          />
        </SectionShell>
      </div>

      <SectionShell icon={<IconExecution className="h-4 w-4" />} title="执行情况">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,200px)_1fr] lg:items-center">
          <div className="flex justify-center lg:justify-start">
            <DonutChart segments={summary.executionSegments} size={156} strokeWidth={18} />
          </div>
          <IconHorizontalBars
            segments={summary.executionSegments}
            renderIcon={(seg) => (
              <ExecutionIcon
                variant={(seg.key ?? "onTrack") as ExecutionVariant}
                className="h-4 w-4"
              />
            )}
          />
        </div>
      </SectionShell>

      <div className="grid gap-4 sm:grid-cols-3">
        <IconMetricTile
          title="便签"
          value={totals.memos}
          accent="#f59e0b"
          icon={<IconMemo className="h-5 w-5 text-white" />}
        />
        <IconMetricTile
          title="贡献记录"
          value={totals.contributions}
          accent="#8b5cf6"
          icon={<IconContribution className="h-5 w-5 text-white" />}
        />
        <IconMetricTile
          title="已归档"
          value={byStatus.archived}
          accent="#9ca3af"
          icon={<IconArchived className="h-5 w-5 text-white" />}
        />
      </div>

      {summary.recentCompletions.length > 0 && (
        <SectionShell icon={<IconRecent className="h-4 w-4" />} title="最近完成">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {summary.recentCompletions.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/plans/${item.id}`}
                  title={item.title}
                  className="flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-gray-50/80 dark:hover:bg-gray-800/30"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                    <IconDone className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.title}
                  </span>
                  <time
                    className="shrink-0 text-xs tabular-nums text-gray-400"
                    dateTime={item.completedAt}
                    title={formatCompletionTime(item.completedAt)}
                  >
                    {formatCompletionTime(item.completedAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </SectionShell>
      )}
    </div>
  );
}
