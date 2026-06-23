"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import type { PlanSummaryStats } from "@/lib/plan-summary";
import { apiJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

function StatCard({
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

function DonutChart({
  segments,
  size = 168,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-dashed border-gray-200 text-xs text-gray-400 dark:border-gray-700"
        style={{ width: size, height: size }}
      >
        暂无数据
      </div>
    );
  }

  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
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
              strokeWidth={stroke}
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
            <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {centerValue}
            </span>
          )}
          {centerLabel && <span className="text-[10px] text-gray-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

function HorizontalBars({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(1, ...segments.map((s) => s.value));

  if (segments.length === 0) {
    return <p className="text-sm text-gray-400">暂无数据</p>;
  }

  return (
    <ul className="space-y-3">
      {segments.map((seg) => (
        <li key={seg.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="text-gray-600 dark:text-gray-300">{seg.label}</span>
            <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{seg.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
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

function Legend({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {segments.map((seg) => (
        <li key={seg.label} className="flex items-center justify-between gap-2 text-xs">
          <span className="flex min-w-0 items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="truncate">{seg.label}</span>
          </span>
          <span className="shrink-0 font-medium tabular-nums">{seg.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function SummaryDashboard() {
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

  if (loading) return <Loading label="加载总结…" />;
  if (error) {
    return (
      <EmptyState
        title="加载失败"
        description={error}
        action={
          <button
            type="button"
            className="text-sm text-brand-600 hover:underline"
            onClick={() => {
              setLoading(true);
              load().finally(() => setLoading(false));
            }}
          >
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
              <DonutChart segments={summary.executionSegments} size={140} />
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
