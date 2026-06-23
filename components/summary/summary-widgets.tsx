"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanSummaryStats } from "@/lib/plan-summary";
import { apiJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export type SummarySegment = { label: string; value: number; color: string };

export function usePlanSummary() {
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
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
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
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-1.5 py-1.5 text-center dark:border-gray-800 dark:bg-gray-800/40">
      <p
        className="text-base font-bold tabular-nums leading-none text-gray-900 dark:text-gray-100"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[10px] leading-tight text-gray-500">{label}</p>
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
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-dashed border-gray-200 text-[10px] text-gray-400 dark:border-gray-700"
        style={{ width: size, height: size }}
      >
        暂无
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
}: {
  segments: SummarySegment[];
  dense?: boolean;
}) {
  const max = Math.max(1, ...segments.map((s) => s.value));

  if (segments.length === 0) {
    return <p className="text-xs text-gray-400">暂无数据</p>;
  }

  return (
    <ul className={dense ? "space-y-1.5" : "space-y-3"}>
      {segments.map((seg) => (
        <li key={seg.label}>
          <div
            className={cn(
              "mb-0.5 flex items-center justify-between gap-2",
              dense ? "text-[10px]" : "text-xs",
            )}
          >
            <span className="truncate text-gray-600 dark:text-gray-300">{seg.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-gray-900 dark:text-gray-100">
              {seg.value}
            </span>
          </div>
          <div
            className={cn(
              "overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
              dense ? "h-1.5" : "h-2",
            )}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(seg.value / max) * 100}%`, backgroundColor: seg.color }}
            />
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
