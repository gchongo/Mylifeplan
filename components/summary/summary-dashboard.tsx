"use client";

import { EmptyState, Loading } from "@/components/ui/feedback";
import {
  COMPLETION_RATE_LABEL,
  CompletionRateDonut,
  EXECUTION_COUNT_HINT,
  ExecutionBreakdown,
  renderStatusIcon,
  renderTypeIcon,
} from "@/components/summary/summary-charts";
import {
  AdaptiveDistributionChart,
  IconMetricTile,
  PRIMARY_PLAN_STAT_ITEMS,
  SectionShell,
  VerticalBarChart,
  getPrimaryPlanStatValue,
  usePlanSummary,
} from "@/components/summary/summary-widgets";
import {
  IconDone,
  IconEarly,
  IconExecution,
  IconInProgress,
  IconNotStarted,
  IconOverdue,
  IconPlans,
  IconStatus,
  IconType,
} from "@/components/summary/summary-icons";
import { cn } from "@/lib/utils";

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

export function SummaryDashboard({ className }: { className?: string }) {
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

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-3", className)}>
      <section className="shrink-0 rounded-xl border border-gray-100 bg-gradient-to-r from-indigo-50/80 via-white to-cyan-50/50 p-3 shadow-sm dark:border-gray-800 dark:from-indigo-950/25 dark:via-gray-900 dark:to-cyan-950/15">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          核心指标
        </h2>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex shrink-0 flex-col items-center justify-center lg:w-36">
            <p className="mb-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {COMPLETION_RATE_LABEL}
            </p>
            <CompletionRateDonut
              statusSegments={summary.statusSegments}
              completionRate={summary.completionRate}
              size={96}
              centerValueClassName="text-lg"
            />
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {PRIMARY_PLAN_STAT_ITEMS.map((item) => {
              const Icon = PRIMARY_ICONS[item.key];
              return (
                <IconMetricTile
                  key={item.key}
                  title={item.label}
                  value={getPrimaryPlanStatValue(summary, item.key)}
                  accent={PRIMARY_ACCENTS[item.key]}
                  icon={<Icon className="h-4 w-4 text-white" />}
                  compact
                />
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <SectionShell icon={<IconStatus className="h-3.5 w-3.5" />} title="状态分布">
          <VerticalBarChart
            segments={summary.statusSegments}
            renderIcon={renderStatusIcon}
            barAreaHeight={88}
          />
        </SectionShell>

        <SectionShell icon={<IconType className="h-3.5 w-3.5" />} title="计划类型">
          <AdaptiveDistributionChart
            segments={summary.typeSegments}
            renderIcon={renderTypeIcon}
            pieMaxSegments={2}
          />
        </SectionShell>

        <SectionShell
          icon={<IconExecution className="h-3.5 w-3.5" />}
          title="执行情况"
          className="lg:col-span-2"
          contentClassName="p-2.5"
        >
          <p className="mb-2 text-[11px] text-gray-400">{EXECUTION_COUNT_HINT}</p>
          <ExecutionBreakdown segments={summary.executionSegments} columns={2} />
        </SectionShell>
      </div>
    </div>
  );
}
