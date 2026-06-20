"use client";

import Link from "next/link";
import { useState } from "react";
import { SubtaskDetailPanel } from "@/components/gantt/drawer-subtask-tree";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import type { TaskFormValues } from "@/components/forms/task-form";
import { formatEventSchedule, itemAccent } from "@/lib/calendar-display";
import type { CalendarItem } from "@/types";
import { getStatusStyle } from "@/lib/task-status-style";
import { cn } from "@/lib/utils";

function itemHref(item: CalendarItem) {
  return item.type === "task" ? `/tasks/${item.id}` : `/plans/${item.id}`;
}

type PlanDetail = {
  id: string;
  description?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
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
        <dd>{plan.startDate ?? "—"}</dd>
        <dt className="text-gray-400">截止</dt>
        <dd>{plan.dueDate ?? "—"}</dd>
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
  const [taskDetail, setTaskDetail] = useState<(TaskFormValues & { id: string }) | null>(null);
  const [planDetail, setPlanDetail] = useState<PlanDetail | null>(null);

  const statusStyle =
    item.type === "task" ? getStatusStyle(item.status, item.dueDate ?? undefined) : null;
  const accent = itemAccent(item);

  async function toggleExpand() {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (!willExpand || !expandable) return;
    if (item.type === "task" && taskDetail) return;
    if (item.type === "plan" && planDetail) return;

    setLoading(true);
    try {
      const endpoint = item.type === "task" ? `/api/tasks/${item.id}` : `/api/plans/${item.id}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (item.type === "task" && data.task) setTaskDetail(data.task);
      if (item.type === "plan" && data.plan) {
        setPlanDetail({
          id: data.plan.id,
          description: data.plan.description,
          startDate: data.plan.startDate,
          dueDate: data.plan.dueDate,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  if (!expandable) {
    return (
      <Link href={itemHref(item)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
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
          item.type === "task" && statusStyle?.rowBg,
          item.type === "task" && statusStyle?.stripe,
          item.type === "plan" && "border-l-violet-400 bg-violet-50/40",
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
        {item.type === "task" ? (
          <TaskStatusIndicator status={item.status} dueDate={item.dueDate ?? undefined} />
        ) : null}
        <span className="shrink-0 text-xs text-gray-400">{formatEventSchedule(item)}</span>
      </div>

      {expanded && (
        <div className="ml-6 mt-2 space-y-2 border-l border-dashed border-gray-200 pl-3">
          {loading && <p className="text-xs text-gray-400">加载详情…</p>}
          {!loading && item.type === "task" && taskDetail && <SubtaskDetailPanel detail={taskDetail} />}
          {!loading && item.type === "plan" && planDetail && <PlanInlineDetail plan={planDetail} />}
          {!loading && item.type === "task" && (
            <Link href={itemHref(item)} className="inline-block text-sm text-brand-600 hover:underline">
              查看完整任务 →
            </Link>
          )}
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
        <li key={`${item.type}-${item.id}`}>
          <CalendarDrawerItemRow item={item} expandable={expandable} />
        </li>
      ))}
    </ul>
  );
}
