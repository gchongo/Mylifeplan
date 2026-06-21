"use client";

import Link from "next/link";
import { useState } from "react";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import { formatEventSchedule, itemAccent } from "@/lib/calendar-display";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import type { CalendarItem } from "@/types";
import { getStatusStyle } from "@/lib/task-status-style";
import { cn } from "@/lib/utils";

type PlanDetail = {
  id: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

function PlanInlineDetail({ plan }: { plan: PlanDetail }) {
  return (
    <div className="space-y-2 text-xs text-gray-600">
      {plan.description ? (
        <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-sm text-gray-700">
          {plan.description}
        </p>
      ) : (
        <p className="text-gray-400">暂无描述</p>
      )}
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
        <dt className="text-gray-400">开始</dt>
        <dd>{formatPlanDateTimeDisplay(plan.startDate)}</dd>
        <dt className="text-gray-400">结束</dt>
        <dd>{formatPlanDateTimeDisplay(plan.endDate)}</dd>
      </dl>
      <Link href={`/plans/${plan.id}`} className="text-sm text-brand-600 hover:underline">
        查看完整计划 →
      </Link>
    </div>
  );
}

function CalendarDrawerItemRow({
  item,
  expandable,
}: {
  item: CalendarItem;
  expandable: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [planDetail, setPlanDetail] = useState<PlanDetail | null>(null);

  const statusStyle = getStatusStyle(item.status, item.endDate ?? undefined);
  const accent = itemAccent(item);

  async function toggleExpand() {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (!willExpand || !expandable || planDetail) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/plans/${item.id}`);
      const data = await res.json();
      if (data.plan) {
        setPlanDetail({
          id: data.plan.id,
          description: data.plan.description,
          startDate: data.plan.startDate,
          endDate: data.plan.endDate,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  if (!expandable) {
    return (
      <Link href={`/plans/${item.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", accent.dot)} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{item.title}</span>
        <span className="shrink-0 text-xs text-gray-400">{formatEventSchedule(item)}</span>
      </Link>
    );
  }

  return (
    <div className="px-3 py-2">
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg border border-gray-100 border-l-2 px-2 py-2",
          statusStyle.rowBg,
          statusStyle.stripe,
        )}
      >
        <button
          type="button"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100"
          onClick={toggleExpand}
          aria-label={expanded ? "折叠详情" : "展开详情"}
        >
          <span className={cn("text-[10px] transition-transform", expanded && "rotate-90")}>▶</span>
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{item.title}</span>
        <TaskStatusIndicator status={item.status} dueDate={item.endDate ?? undefined} overdue={item.overdue} />
        <span className="shrink-0 text-xs text-gray-400">{formatEventSchedule(item)}</span>
      </div>

      {expanded && (
        <div className="ml-6 mt-2 space-y-2 border-l border-dashed border-gray-200 pl-3">
          {loading && <p className="text-xs text-gray-400">加载详情…</p>}
          {!loading && planDetail && <PlanInlineDetail plan={planDetail} />}
        </div>
      )}
    </div>
  );
}

export function CalendarDrawerItemList({
  items,
  expandable,
}: {
  items: CalendarItem[];
  expandable: boolean;
}) {
  if (items.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-gray-400">当天暂无安排</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {items.map((item) => (
        <li key={item.id}>
          <CalendarDrawerItemRow item={item} expandable={expandable} />
        </li>
      ))}
    </ul>
  );
}
