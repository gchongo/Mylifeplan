"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import { SummaryCompletionExecutionRow } from "@/components/summary/summary-charts";
import { PrimaryPlanStats, usePlanSummary } from "@/components/summary/summary-widgets";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function SummaryPanelLive({ className }: { className?: string }) {
  const { t } = useI18n();
  const { summary, loading, error, reload } = usePlanSummary();

  return (
    <Card
      className={cn(
        "flex h-auto min-h-0 min-w-0 max-w-full flex-col overflow-hidden border-0 bg-transparent shadow-none",
        className,
      )}
    >
      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1 pb-2">
        <CardTitle className="min-w-0 truncate text-gray-900 dark:text-gray-100">{t("summary.homeTitle")}</CardTitle>
        <PanelExpandButton href="/summary" label={t("summary.expand")} />
      </div>

      <CardContent className="shrink-0 overflow-hidden p-0">
        {loading && <Loading label={t("common.loading")} className="py-6" />}
        {!loading && error && (
          <EmptyState
            title={t("summary.loadFailed")}
            description={error}
            className="border-0 bg-transparent py-6"
            action={
              <button type="button" className="text-xs text-brand-600 hover:underline" onClick={reload}>
                {t("common.retry")}
              </button>
            }
          />
        )}
        {!loading && !error && summary && (
          <div className="flex flex-col gap-2">
            <PrimaryPlanStats summary={summary} singleRow />

            <SummaryCompletionExecutionRow summary={summary} />

            {summary.totals.plans === 0 && (
              <p className="text-center text-xs text-gray-400">{t("summary.emptyHint")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
