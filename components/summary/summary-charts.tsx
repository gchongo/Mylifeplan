"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { PlanSummaryStats } from "@/lib/plan-summary";
import type { SummarySegment } from "@/components/summary/summary-widgets";
import {
  DonutChart,
  IconHorizontalBars,
  type SummarySegment as Seg,
} from "@/components/summary/summary-widgets";
import {
  ExecutionIcon,
  StatusIcon,
  TypeIcon,
  type ExecutionVariant,
} from "@/components/summary/summary-icons";
import { useI18n } from "@/components/i18n/i18n-provider";
import { localizeSummarySegments } from "@/lib/i18n/summary-segments";
import { cn } from "@/lib/utils";

export function renderStatusIcon(seg: SummarySegment) {
  return <StatusIcon status={(seg.key ?? "not_started") as import("@/types").PlanStatus} className="h-3.5 w-3.5" />;
}

export function renderTypeIcon(seg: SummarySegment) {
  return <TypeIcon type={(seg.key ?? "goal") as import("@/types").PlanType} className="h-3.5 w-3.5" />;
}

export function renderExecutionIcon(seg: SummarySegment) {
  return (
    <ExecutionIcon variant={(seg.key ?? "onTrack") as ExecutionVariant} className="h-3.5 w-3.5" />
  );
}

export function CompletionRateDonut({
  statusSegments,
  completionRate,
  size = 96,
  strokeWidth,
  centerValueClassName,
  className,
}: {
  statusSegments: Seg[];
  completionRate: number;
  size?: number;
  strokeWidth?: number;
  centerValueClassName?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const sw = strokeWidth ?? Math.max(10, Math.round(size * 0.14));

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <DonutChart
        segments={statusSegments}
        size={size}
        strokeWidth={sw}
        centerValue={`${completionRate}%`}
        centerLabel={t("summary.completionRate")}
        centerValueClassName={centerValueClassName}
      />
    </div>
  );
}

export function ExecutionBreakdown({
  segments,
  columns = 1,
  dense = false,
  className,
  emptyText,
  barWidthScale = 1,
  layout,
}: {
  segments: Seg[];
  columns?: 1 | 2;
  dense?: boolean;
  className?: string;
  emptyText?: string;
  barWidthScale?: number;
  layout?: "stacked" | "inline";
}) {
  const { t } = useI18n();
  const label = emptyText ?? t("summary.noExecutionData");

  if (segments.length === 0) {
    return <p className={cn("text-gray-400", dense ? "text-[10px]" : "text-xs")}>{label}</p>;
  }

  return (
    <IconHorizontalBars
      segments={segments}
      renderIcon={renderExecutionIcon}
      columns={columns}
      dense={dense}
      barWidthScale={barWidthScale}
      layout={layout ?? (dense ? "inline" : "stacked")}
      className={className}
    />
  );
}

export function SummaryCompletionExecutionRow({
  summary,
  className,
}: {
  summary: PlanSummaryStats;
  className?: string;
}) {
  const { t } = useI18n();
  const barsRef = useRef<HTMLDivElement>(null);
  const [donutSize, setDonutSize] = useState(88);

  const statusSegments = localizeSummarySegments(summary.statusSegments, "status", t);
  const executionSegments = localizeSummarySegments(summary.executionSegments, "executionLabel", t);

  useLayoutEffect(() => {
    const el = barsRef.current;
    if (!el) return;

    const update = () => {
      const h = el.clientHeight;
      if (h > 0) setDonutSize(Math.max(84, Math.min(128, h - 6)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [summary.executionSegments.length]);

  return (
    <div
      className={cn(
        "flex items-stretch gap-4 rounded-lg border border-gray-100 bg-white/60 py-2.5 pl-4 pr-3 dark:border-gray-800 dark:bg-gray-900/40",
        className,
      )}
    >
      <div className="flex min-w-[7rem] shrink-0 flex-col items-center self-stretch px-2">
        <p className="mb-1 w-full text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">
          {t("summary.completionRate")}
        </p>
        <div className="flex flex-1 items-center justify-center px-1 py-1">
          <CompletionRateDonut
            statusSegments={statusSegments}
            completionRate={summary.completionRate}
            size={donutSize}
            centerValueClassName={donutSize < 96 ? "text-xs" : "text-sm"}
          />
        </div>
      </div>

      <div
        ref={barsRef}
        className="flex min-h-[72px] min-w-0 flex-1 flex-col self-stretch border-l border-gray-100 py-0.5 pl-3.5 dark:border-gray-800"
      >
        <p className="mb-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">{t("summary.execution")}</p>
        <div className="flex flex-1 items-center">
          <ExecutionBreakdown segments={executionSegments} dense layout="inline" className="w-full" />
        </div>
      </div>
    </div>
  );
}
