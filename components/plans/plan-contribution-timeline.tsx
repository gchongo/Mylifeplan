"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContributionMarkdown } from "@/components/contributions/contribution-markdown";
import { GanttContributionDrawerPanel } from "@/components/gantt/gantt-contribution-drawer";

export interface PlanContributionItem {
  id: string;
  planId: string;
  planTitle?: string;
  title: string;
  description?: string | null;
  body?: string | null;
  imageUrls?: string[];
  occurredOn: string;
  occurredEndOn?: string | null;
}

export function PlanContributionTimeline({
  contributions,
  currentPlanId,
  onChanged,
}: {
  contributions: PlanContributionItem[];
  currentPlanId: string;
  onChanged?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (contributions.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">执行时间线</CardTitle>
          <p className="text-xs text-gray-500">
            共 {contributions.length} 条记录，按计划执行顺序排列
          </p>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-0 border-l border-gray-200 pl-4 dark:border-gray-700">
            {contributions.map((entry) => {
              const preview = entry.body?.trim() || entry.description?.trim() || "";
              const dateLabel =
                entry.occurredEndOn && entry.occurredEndOn !== entry.occurredOn
                  ? `${formatPlanDateTimeDisplay(entry.occurredOn)} ~ ${formatPlanDateTimeDisplay(entry.occurredEndOn)}`
                  : formatPlanDateTimeDisplay(entry.occurredOn);
              const isOtherPlan = entry.planId !== currentPlanId;

              return (
                <li key={entry.id} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <button
                        type="button"
                        onClick={() => setSelectedId(entry.id)}
                        className="text-left font-medium text-gray-900 hover:text-brand-600 dark:text-gray-100"
                      >
                        {entry.title}
                      </button>
                      <span className="text-xs text-gray-400">{dateLabel}</span>
                    </div>
                    {isOtherPlan && entry.planTitle && (
                      <p className="text-xs text-gray-500">子计划：{entry.planTitle}</p>
                    )}
                    {preview && (
                      <div className="line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                        <ContributionMarkdown content={preview.slice(0, 300)} />
                      </div>
                    )}
                    {entry.imageUrls && entry.imageUrls.length > 0 && (
                      <div className="flex gap-1 pt-1">
                        {entry.imageUrls.slice(0, 3).map((url) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={url} src={url} alt="" className="h-10 w-10 rounded object-cover" />
                        ))}
                        {entry.imageUrls.length > 3 && (
                          <span className="self-center text-xs text-gray-400">
                            +{entry.imageUrls.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setSelectedId(entry.id)}
                      >
                        查看详情
                      </Button>
                      <Link
                        href={`/plans/${entry.planId}`}
                        className="self-center text-xs text-brand-600 hover:underline"
                      >
                        所属计划
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="关闭"
            onClick={() => setSelectedId(null)}
          />
          <div className="relative z-10 h-full w-full max-w-md overflow-y-auto bg-white shadow-xl dark:bg-gray-900">
            <GanttContributionDrawerPanel
              contributionId={selectedId}
              onClose={() => setSelectedId(null)}
              onUpdated={onChanged}
              onDeleted={() => {
                setSelectedId(null);
                onChanged?.();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
