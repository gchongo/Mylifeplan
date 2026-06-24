"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanSummaryStats } from "@/lib/plan-summary";
import { apiJson } from "@/lib/client-api";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export type SummarySegment = { key?: string; label: string; value: number; color: string };

/** 图表内图标统一占位，保证上下左右对齐 */
export function ChartIconSlot({
  children,
  className,
  tinted,
}: {
  children: ReactNode;
  className?: string;
  /** 使用 segment 色作淡底 */
  tinted?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-50 dark:bg-gray-800/80",
        className,
      )}
      style={tinted ? { color: tinted, backgroundColor: `${tinted}18` } : undefined}
    >
      {children}
    </span>
  );
}

function ChartEmpty({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "flex h-full min-h-[7rem] items-center justify-center rounded-lg border border-dashed border-gray-200 text-xs text-gray-400 dark:border-gray-700",
        className,
      )}
    >
      {t("summary.noData")}
    </div>
  );
}

/** 纵向柱形图：数值在上、柱体居中、图标与标签底对齐 */
export function VerticalBarChart({
  segments,
  renderIcon,
  barAreaHeight = 96,
  className,
}: {
  segments: SummarySegment[];
  renderIcon: (seg: SummarySegment) => ReactNode;
  barAreaHeight?: number;
  className?: string;
}) {
  const max = Math.max(1, ...segments.map((s) => s.value));

  if (segments.length === 0) return <ChartEmpty className={className} />;

  return (
    <div
      className={cn("grid h-full gap-x-2", className)}
      style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}
    >
      {segments.map((seg) => {
        const pct = (seg.value / max) * 100;
        return (
          <div key={seg.key ?? seg.label} className="flex min-w-0 flex-col items-center">
            <span className="mb-1 text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {seg.value}
            </span>
            <div
              className="flex w-full items-end justify-center px-0.5"
              style={{ height: barAreaHeight }}
            >
              <div
                className="w-full max-w-[2.25rem] min-w-[0.75rem] rounded-t-md transition-all"
                style={{
                  height: `${pct}%`,
                  minHeight: seg.value > 0 ? 6 : 0,
                  backgroundColor: seg.color,
                }}
              />
            </div>
            <div className="mt-2 flex flex-col items-center gap-1">
              <ChartIconSlot tinted={seg.color}>{renderIcon(seg)}</ChartIconSlot>
              <span className="line-clamp-2 w-full text-center text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                {seg.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 仅两项（或少量）数据时用饼图 + 右侧图例 */
export function PieChartPanel({
  segments,
  renderIcon,
  size = 96,
  strokeWidth = 14,
  className,
}: {
  segments: SummarySegment[];
  renderIcon: (seg: SummarySegment) => ReactNode;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const { t } = useI18n();
  if (segments.length === 0) return <ChartEmpty className={className} />;

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className={cn("flex h-full items-center gap-4", className)}>
      <div className="flex shrink-0 flex-col items-center justify-center">
        <DonutChart segments={segments} size={size} strokeWidth={strokeWidth} />
        <span className="mt-1 text-[10px] tabular-nums text-gray-400">{t("summary.totalCount", { total })}</span>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        {segments.map((seg) => (
          <li
            key={seg.key ?? seg.label}
            className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-2 rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-800/50"
          >
            <ChartIconSlot tinted={seg.color}>{renderIcon(seg)}</ChartIconSlot>
            <span className="truncate text-xs text-gray-600 dark:text-gray-300">{seg.label}</span>
            <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {seg.value}
              <span className="ml-0.5 font-normal text-gray-400">
                ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** ≤2 项用饼图，更多项用柱形图 */
export function AdaptiveDistributionChart({
  segments,
  renderIcon,
  pieMaxSegments = 2,
  className,
}: {
  segments: SummarySegment[];
  renderIcon: (seg: SummarySegment) => ReactNode;
  pieMaxSegments?: number;
  className?: string;
}) {
  if (segments.length === 0) return <ChartEmpty className={className} />;
  if (segments.length <= pieMaxSegments) {
    return <PieChartPanel segments={segments} renderIcon={renderIcon} className={className} />;
  }
  return <VerticalBarChart segments={segments} renderIcon={renderIcon} className={className} />;
}

export function usePlanSummary() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<PlanSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const data = await apiJson<{ summary: PlanSummaryStats }>("/api/summary");
    setSummary(data.summary);
  }, []);

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : t("summary.loadFailed")))
      .finally(() => setLoading(false));
  }, [load]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await load();
    } finally {
      setLoading(false);
    }
  }, [load]);

  return { summary, loading, error, reload };
}

export function IconMetricTile({
  icon,
  value,
  accent,
  title,
  className,
  compact = false,
}: {
  icon: ReactNode;
  value: number | string;
  accent: string;
  title: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900",
        compact ? "px-2.5 py-2" : "px-3 py-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg text-white",
          compact ? "h-8 w-8" : "h-9 w-9",
        )}
        style={{ backgroundColor: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "font-bold tabular-nums leading-none text-gray-900 dark:text-gray-100",
            compact ? "text-lg" : "text-xl",
          )}
        >
          {value}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </div>
  );
}

export function SectionShell({
  icon,
  children,
  className,
  title,
  contentClassName,
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  title: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("flex min-h-0 flex-col overflow-hidden border-gray-100/80 shadow-sm dark:border-gray-800", className)}>
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <CardContent className={cn("min-h-0 flex-1 overflow-hidden p-3", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function IconHorizontalBars({
  segments,
  renderIcon,
  className,
  columns = 1,
  dense = false,
  barWidthScale = 1,
}: {
  segments: SummarySegment[];
  renderIcon: (seg: SummarySegment) => ReactNode;
  className?: string;
  columns?: 1 | 2;
  dense?: boolean;
  barWidthScale?: number;
}) {
  const { t } = useI18n();
  const max = Math.max(1, ...segments.map((s) => s.value));
  const widthScale = Math.min(1, Math.max(0.5, barWidthScale));

  if (segments.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-400 dark:border-gray-700",
          dense ? "h-12 text-[10px]" : "h-16 text-xs",
        )}
      >
        {t("summary.noData")}
      </div>
    );
  }

  return (
    <ul
      className={cn(
        columns === 2 ? "grid grid-cols-2 gap-x-3 gap-y-2" : dense ? "space-y-1.5" : "space-y-2",
        className,
      )}
    >
      {segments.map((seg) => (
        <li key={seg.key ?? seg.label}>
          <div
            className={cn(
              "mb-1 flex items-center justify-between gap-2",
              dense ? "text-[10px]" : "text-xs",
            )}
          >
            <span className="flex min-w-0 items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <ChartIconSlot tinted={seg.color}>{renderIcon(seg)}</ChartIconSlot>
              <span className="truncate">{seg.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">{seg.value}</span>
          </div>
          <div
            className={cn(
              "overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
              dense ? "h-1" : "h-1.5",
            )}
            style={{ width: `${widthScale * 100}%` }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(seg.value / max) * 100}%`,
                backgroundColor: seg.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function IconLegend({
  segments,
  renderIcon,
  dense = false,
}: {
  segments: SummarySegment[];
  renderIcon: (seg: SummarySegment) => ReactNode;
  dense?: boolean;
}) {
  return (
    <ul className={cn("space-y-1", dense ? "text-[11px]" : "text-xs")}>
      {segments.map((seg) => (
        <li
          key={seg.key ?? seg.label}
          className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-800/50"
        >
          <span className="flex min-w-0 items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <ChartIconSlot tinted={seg.color}>{renderIcon(seg)}</ChartIconSlot>
            <span className="truncate">{seg.label}</span>
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">{seg.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accentClass,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accentClass?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-4">
        {accentClass && (
          <div className={cn("absolute left-0 top-0 h-full w-1", accentClass)} aria-hidden />
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
        {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function MiniStat({
  label,
  value,
  color,
  hint,
  compact = false,
}: {
  label: string;
  value: number | string;
  color?: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-100 bg-gray-50/80 text-center dark:border-gray-800 dark:bg-gray-800/40",
        compact ? "px-1 py-1" : "px-1.5 py-1.5",
      )}
      title={hint}
    >
      <p
        className={cn(
          "font-bold tabular-nums leading-none text-gray-900 dark:text-gray-100",
          compact ? "text-sm" : "text-base",
        )}
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate leading-tight text-gray-500",
          compact ? "text-[9px]" : "text-[10px]",
        )}
      >
        {label}
      </p>
    </div>
  );
}

export const PRIMARY_PLAN_STAT_ITEMS = [
  { key: "total", label: "total", color: "#6366f1", hintKey: "totalHint" as const },
  { key: "in_progress", label: "in_progress", color: "#3b82f6" },
  { key: "done", label: "done", color: "#22c55e" },
  { key: "not_started", label: "not_started", color: "#f59e0b" },
  { key: "deadlineOverdue", label: "deadlineOverdue", color: "#ef4444", hintKey: "deadlineOverdueHint" as const },
  { key: "earlyCompleted", label: "earlyCompleted", color: "#10b981", hintKey: "earlyCompletedHint" as const },
] as const;

export function getPrimaryPlanStatValue(
  summary: PlanSummaryStats,
  key: (typeof PRIMARY_PLAN_STAT_ITEMS)[number]["key"],
): number {
  switch (key) {
    case "total":
      return summary.totals.plans;
    case "in_progress":
      return summary.byStatus.in_progress;
    case "done":
      return summary.byStatus.done;
    case "not_started":
      return summary.byStatus.not_started;
    case "deadlineOverdue":
      return summary.execution.deadlineOverdue;
    case "earlyCompleted":
      return summary.execution.earlyCompleted;
  }
}

export function PrimaryPlanStats({
  summary,
  singleRow = false,
}: {
  summary: PlanSummaryStats;
  singleRow?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className={cn("grid gap-1", singleRow ? "grid-cols-6" : "grid-cols-3 gap-1.5")}>
      {PRIMARY_PLAN_STAT_ITEMS.map((item) => (
        <MiniStat
          key={item.key}
          label={t(`summary.metric.${item.key}`)}
          value={getPrimaryPlanStatValue(summary, item.key)}
          color={item.color}
          hint={"hintKey" in item ? t(`summary.metric.${item.hintKey}`) : undefined}
          compact={singleRow}
        />
      ))}
    </div>
  );
}

export function DonutChart({
  segments,
  size = 168,
  strokeWidth = 22,
  centerLabel,
  centerValue,
  centerValueClassName,
}: {
  segments: SummarySegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string | number;
  centerValueClassName?: string;
}) {
  const { t } = useI18n();
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-dashed border-gray-200 text-[10px] text-gray-400 dark:border-gray-700"
        style={{ width: size, height: size }}
      >
        {t("summary.emptyShort")}
      </div>
    );
  }

  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
        />
        {segments.map((seg) => {
          const len = (seg.value / total) * circumference;
          const dasharray = `${len} ${circumference - len}`;
          const el = (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {(centerLabel || centerValue !== undefined) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue !== undefined && (
            <span
              className={cn(
                "font-bold tabular-nums text-gray-900 dark:text-gray-100",
                centerValueClassName ?? "text-2xl",
              )}
            >
              {centerValue}
            </span>
          )}
          {centerLabel && <span className="text-[10px] text-gray-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function HorizontalBars({
  segments,
  dense = false,
  className,
  /** 条形最大宽度占比（0–1），用于右侧留白 */
  barWidthScale = 1,
}: {
  segments: SummarySegment[];
  dense?: boolean;
  className?: string;
  barWidthScale?: number;
}) {
  const { t } = useI18n();
  const max = Math.max(1, ...segments.map((s) => s.value));
  const widthScale = Math.min(1, Math.max(0.5, barWidthScale));

  if (segments.length === 0) {
    return <p className="text-xs text-gray-400">{t("summary.noData")}</p>;
  }

  return (
    <ul className={cn(dense ? "space-y-1.5" : "space-y-3", className)}>
      {segments.map((seg) => (
        <li key={seg.label}>
          <div
            className={cn(
              "mb-0.5 truncate text-gray-600 dark:text-gray-300",
              dense ? "text-[10px]" : "text-xs",
            )}
          >
            {seg.label}
          </div>
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
                dense ? "h-1.5" : "h-2",
              )}
              style={{ width: `${widthScale * 100}%` }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(seg.value / max) * 100}%`,
                  backgroundColor: seg.color,
                }}
              />
            </div>
            <span
              className={cn(
                "shrink-0 font-medium tabular-nums text-gray-900 dark:text-gray-100",
                dense ? "w-4 text-right text-[10px]" : "w-5 text-right text-xs",
              )}
            >
              {seg.value}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Legend({
  segments,
  dense = false,
}: {
  segments: SummarySegment[];
  dense?: boolean;
}) {
  return (
    <ul className={dense ? "space-y-1" : "space-y-1.5"}>
      {segments.map((seg) => (
        <li
          key={seg.label}
          className={cn(
            "flex items-center justify-between gap-2",
            dense ? "text-[10px]" : "text-xs",
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <span
              className={cn("shrink-0 rounded-full", dense ? "h-2 w-2" : "h-2.5 w-2.5")}
              style={{ backgroundColor: seg.color }}
            />
            <span className="truncate">{seg.label}</span>
          </span>
          <span className="shrink-0 font-medium tabular-nums">{seg.value}</span>
        </li>
      ))}
    </ul>
  );
}
