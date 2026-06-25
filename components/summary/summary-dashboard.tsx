"use client";

import { EmptyState, Loading } from "@/components/ui/feedback";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  CompletionRateDonut,
  ExecutionBreakdown,
  renderStatusIcon,
  renderTypeIcon,
} from "@/components/summary/summary-charts";
import {
  AdaptiveDistributionChart,
  PrimaryPlanStats,
  SectionShell,
  VerticalBarChart,
  usePlanSummary,
} from "@/components/summary/summary-widgets";
import {
  IconExecution,
  IconStatus,
  IconType,
} from "@/components/summary/summary-icons";
import { localizeSummarySegments } from "@/lib/i18n/summary-segments";
import { cn } from "@/lib/utils";

export function SummaryDashboard({ className }: { className?: string }) {
  const { t } = useI18n();
  const { summary, loading, error, reload } = usePlanSummary();

  if (loading) return <Loading label={t("summary.loading")} />;
  if (error) {
    return (
      <EmptyState
        title={t("summary.loadFailed")}
        description={error}
        action={
          <button type="button" className="text-sm text-brand-600 hover:underline" onClick={reload}>
            {t("common.retry")}
          </button>
        }
      />
    );
  }
  if (!summary) {
    return <EmptyState title={t("summary.noData")} description={t("summary.noDataHint")} />;
  }

  const statusSegments = localizeSummarySegments(summary.statusSegments, "status", t);
  const typeSegments = localizeSummarySegments(summary.typeSegments, "type", t);
  const executionSegments = localizeSummarySegments(summary.executionSegments, "executionLabel", t);

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-3", className)}>
      <section className="shrink-0 rounded-xl border border-gray-100 bg-gradient-to-r from-indigo-50/80 via-white to-cyan-50/50 p-3 shadow-sm dark:border-gray-800 dark:from-indigo-950/25 dark:via-gray-900 dark:to-cyan-950/15">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("summary.coreMetrics")}
        </h2>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex shrink-0 flex-col items-center justify-center lg:w-36">
            <p className="mb-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {t("summary.completionRate")}
            </p>
            <CompletionRateDonut
              statusSegments={statusSegments}
              completionRate={summary.completionRate}
              size={96}
              centerValueClassName="text-lg"
            />
          </div>
          <div className="min-w-0 flex-1">
            <PrimaryPlanStats summary={summary} singleRow />
          </div>
        </div>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <SectionShell icon={<IconStatus className="h-3.5 w-3.5" />} title={t("summary.statusDistribution")}>
          <VerticalBarChart segments={statusSegments} renderIcon={renderStatusIcon} barAreaHeight={88} />
        </SectionShell>

        <SectionShell icon={<IconType className="h-3.5 w-3.5" />} title={t("summary.planTypes")}>
          <AdaptiveDistributionChart segments={typeSegments} renderIcon={renderTypeIcon} pieMaxSegments={2} />
        </SectionShell>

        <SectionShell
          icon={<IconExecution className="h-3.5 w-3.5" />}
          title={t("summary.execution")}
          className="lg:col-span-2"
          contentClassName="p-2.5"
        >
          <p className="mb-2 text-[11px] text-gray-400">{t("summary.executionHint")}</p>
          <ExecutionBreakdown segments={executionSegments} columns={2} />
        </SectionShell>
      </div>
    </div>
  );
}
