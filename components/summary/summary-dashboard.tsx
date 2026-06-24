"use client";

import { EmptyState, Loading } from "@/components/ui/feedback";
import {
  AdaptiveDistributionChart,
  DonutChart,
  IconHorizontalBars,
  IconMetricTile,
  PRIMARY_PLAN_STAT_ITEMS,
  SectionShell,
  VerticalBarChart,
  getPrimaryPlanStatValue,
  usePlanSummary,
} from "@/components/summary/summary-widgets";
import {
  ExecutionIcon,
  IconDone,
  IconEarly,
  IconExecution,
  IconInProgress,
  IconNotStarted,
  IconOverdue,
  IconPlans,
  IconStatus,
  IconType,
  StatusIcon,
  TypeIcon,
  type ExecutionVariant,
} from "@/components/summary/summary-icons";
import type { PlanStatus, PlanType } from "@/types";
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

  const renderStatusIcon = (seg: { key?: string }) => (
    <StatusIcon status={(seg.key ?? "not_started") as PlanStatus} className="h-3.5 w-3.5" />
  );
  const renderTypeIcon = (seg: { key?: string }) => (
    <TypeIcon type={(seg.key ?? "goal") as PlanType} className="h-3.5 w-3.5" />
  );
  const renderExecutionIcon = (seg: { key?: string }) => (
    <ExecutionIcon variant={(seg.key ?? "onTrack") as ExecutionVariant} className="h-3.5 w-3.5" />
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-3", className)}>
      <section className="shrink-0 rounded-xl border border-gray-100 bg-gradient-to-r from-indigo-50/80 via-white to-cyan-50/50 p-3 shadow-sm dark:border-gray-800 dark:from-indigo-950/25 dark:via-gray-900 dark:to-cyan-950/15">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          核心指标
        </h2>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center justify-center lg:w-36">
            <DonutChart
              segments={summary.statusSegments}
              size={96}
              strokeWidth={14}
              centerValue={`${summary.completionRate}%`}
              centerLabel="完成率"
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
          <div className="flex h-full items-stretch gap-4">
            {summary.executionSegments.length <= 2 ? (
              <AdaptiveDistributionChart
                className="w-full"
                segments={summary.executionSegments}
                renderIcon={renderExecutionIcon}
                pieMaxSegments={2}
              />
            ) : (
              <>
                <div className="flex shrink-0 items-center justify-center self-center lg:w-28">
                  <DonutChart segments={summary.executionSegments} size={88} strokeWidth={12} />
                </div>
                <div className="min-h-0 min-w-0 flex-1 self-center">
                  <IconHorizontalBars
                    columns={2}
                    segments={summary.executionSegments}
                    renderIcon={renderExecutionIcon}
                  />
                </div>
              </>
            )}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
