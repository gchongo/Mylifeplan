"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { PlanSummaryStats } from "@/lib/plan-summary";
import type { PlanStatus, PlanType } from "@/types";
import {
  DonutChart,
  IconHorizontalBars,
  type SummarySegment,
} from "@/components/summary/summary-widgets";
import {
  ExecutionIcon,
  StatusIcon,
  TypeIcon,
  type ExecutionVariant,
} from "@/components/summary/summary-icons";
import { cn } from "@/lib/utils";

/** 完成率：已完成 ÷ 活跃计划（不含已归档） */
export const COMPLETION_RATE_LABEL = "完成率";

/** 执行情况条形为计划条数；条长为同类相对多少，非总计划占比 */
export const EXECUTION_COUNT_HINT = "各项为计划条数，条长为同类相对多少";

export function renderStatusIcon(seg: SummarySegment) {
  return <StatusIcon status={(seg.key ?? "not_started") as PlanStatus} className="h-3.5 w-3.5" />;
}

export function renderTypeIcon(seg: SummarySegment) {
  return <TypeIcon type={(seg.key ?? "goal") as PlanType} className="h-3.5 w-3.5" />;
}

export function renderExecutionIcon(seg: SummarySegment) {
  return (
    <ExecutionIcon variant={(seg.key ?? "onTrack") as ExecutionVariant} className="h-3.5 w-3.5" />
  );
}

/** 状态圆环 + 完成率（全站唯一展示完成率 % 的图表） */
export function CompletionRateDonut({
  statusSegments,
  completionRate,
  size = 96,
  strokeWidth,
  centerValueClassName,
  className,
}: {
  statusSegments: SummarySegment[];
  completionRate: number;
  size?: number;
  strokeWidth?: number;
  centerValueClassName?: string;
  className?: string;
}) {
  const sw = strokeWidth ?? Math.max(10, Math.round(size * 0.14));

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <DonutChart
        segments={statusSegments}
        size={size}
        strokeWidth={sw}
        centerValue={`${completionRate}%`}
        centerLabel={COMPLETION_RATE_LABEL}
        centerValueClassName={centerValueClassName}
      />
    </div>
  );
}

/** 执行情况条形图（首页与总结页共用，无中心百分比） */
export function ExecutionBreakdown({
  segments,
  columns = 1,
  dense = false,
  className,
  emptyText = "暂无执行数据",
  barWidthScale = 1,
}: {
  segments: SummarySegment[];
  columns?: 1 | 2;
  dense?: boolean;
  className?: string;
  emptyText?: string;
  barWidthScale?: number;
}) {
  if (segments.length === 0) {
    return <p className={cn("text-gray-400", dense ? "text-[10px]" : "text-xs")}>{emptyText}</p>;
  }

  return (
    <IconHorizontalBars
      segments={segments}
      renderIcon={renderExecutionIcon}
      columns={columns}
      dense={dense}
      barWidthScale={barWidthScale}
      className={className}
    />
  );
}

/**
 * 首页紧凑行：左完成率（状态圆环），右执行情况（条形图），与总结页同一套数据与组件。
 */
export function SummaryCompletionExecutionRow({
  summary,
  className,
}: {
  summary: PlanSummaryStats;
  className?: string;
}) {
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
  }, [summary.executionSegments.length]);

  return (
    <div
      className={cn(
        "flex items-stretch gap-3 rounded-lg border border-gray-100 bg-white/60 p-2.5 dark:border-gray-800 dark:bg-gray-900/40",
        className,
      )}
    >
      <div className="flex w-[38%] min-w-[5.5rem] max-w-[7.5rem] shrink-0 flex-col items-center self-stretch">
        <p className="mb-1 w-full text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">
          {COMPLETION_RATE_LABEL}
        </p>
        <div className="flex flex-1 items-center justify-center">
          <CompletionRateDonut
            statusSegments={summary.statusSegments}
            completionRate={summary.completionRate}
            size={donutSize}
            centerValueClassName={donutSize < 90 ? "text-xs" : "text-sm"}
          />
        </div>
      </div>

      <div
        ref={barsRef}
        className="flex min-h-[72px] min-w-0 flex-1 flex-col self-stretch border-l border-gray-100 py-0.5 pl-3 pr-1 dark:border-gray-800"
      >
        <p className="mb-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">执行情况</p>
        <div className="flex flex-1 items-center">
          <ExecutionBreakdown
            segments={summary.executionSegments}
            dense
            barWidthScale={0.88}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
