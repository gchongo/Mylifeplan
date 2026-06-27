"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { PlanRelationshipCard } from "@/components/plans/plan-relationship-card";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import { formatEventSchedule, itemAccent } from "@/lib/calendar-display";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import type { PlanRelationNode } from "@/lib/plan-relationship";
import type { CalendarItem } from "@/types";
import { getStatusStyle } from "@/lib/task-status-style";
import { cn } from "@/lib/utils";

type CalendarPlanDetail = {
  id: string;
  title: string;
  status: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  ancestors: PlanRelationNode[];
  subPlans: PlanRelationNode[];
};

function DrawerItemTitleBlock({
  item,
  scheduleClassName,
}: {
  item: CalendarItem;
  scheduleClassName?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
        {item.title}
      </p>
      <p
        className={cn(
          "mt-0.5 text-[11px] tabular-nums leading-tight text-gray-400 dark:text-gray-500",
          scheduleClassName,
        )}
      >
        {formatEventSchedule(item)}
      </p>
    </div>
  );
}

function mapSubPlans(
  subPlans: Array<{
    id: string;
    title: string;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
    actualStartDate?: string | null;
    actualEndDate?: string | null;
  }>,
): PlanRelationNode[] {
  return subPlans.map((sp) => ({
    id: sp.id,
    title: sp.title,
    status: sp.status,
    startDate: sp.startDate,
    endDate: sp.endDate,
    actualStartDate: sp.actualStartDate,
    actualEndDate: sp.actualEndDate,
  }));
}

function PlanInlineDetail({ plan }: { plan: CalendarPlanDetail }) {
  const { t } = useI18n();
  const currentPlan: PlanRelationNode = {
    id: plan.id,
    title: plan.title,
    status: plan.status,
    startDate: plan.startDate,
    endDate: plan.endDate,
    actualStartDate: plan.actualStartDate,
    actualEndDate: plan.actualEndDate,
  };

  return (
    <div className="space-y-3">
      {plan.description ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {plan.description}
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-gray-600 dark:text-gray-400">
        <dt className="text-gray-400 dark:text-gray-500">{t("planDetail.planStart")}</dt>
        <dd>{formatPlanDateTimeDisplay(plan.startDate)}</dd>
        <dt className="text-gray-400 dark:text-gray-500">{t("planDetail.planEnd")}</dt>
        <dd>{formatPlanDateTimeDisplay(plan.endDate)}</dd>
        <dt className="text-gray-400 dark:text-gray-500">{t("planDetail.actualStart")}</dt>
        <dd>{formatPlanDateTimeDisplay(plan.actualStartDate)}</dd>
        <dt className="text-gray-400 dark:text-gray-500">{t("planDetail.actualEnd")}</dt>
        <dd>{formatPlanDateTimeDisplay(plan.actualEndDate)}</dd>
      </dl>
      <PlanRelationshipCard
        flat
        currentPlan={currentPlan}
        ancestors={plan.ancestors}
        childPlans={plan.subPlans}
        onNavigatePlan={(planId) => {
          window.location.href = `/plans/${planId}`;
        }}
      />
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
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [planDetail, setPlanDetail] = useState<CalendarPlanDetail | null>(null);

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
          title: data.plan.title,
          status: data.plan.status,
          description: data.plan.description,
          startDate: data.plan.startDate,
          endDate: data.plan.endDate,
          actualStartDate: data.plan.actualStartDate,
          actualEndDate: data.plan.actualEndDate,
          ancestors: data.plan.ancestors ?? [],
          subPlans: mapSubPlans(data.plan.subPlans ?? []),
        });
      }
    } finally {
      setLoading(false);
    }
  }

  if (!expandable) {
    return (
      <Link
        href={`/plans/${item.id}`}
        prefetch={false}
        className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900/40"
      >
        <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", accent.dot)} />
        <DrawerItemTitleBlock item={item} />
      </Link>
    );
  }

  return (
    <div className="px-3 py-2">
      <div
        className={cn(
          "flex items-start gap-1 rounded-lg border border-gray-100 border-l-2 px-2 py-2 dark:border-gray-800",
          statusStyle.rowBg,
          statusStyle.stripe,
        )}
      >
        <button
          type="button"
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => void toggleExpand()}
          aria-label={expanded ? t("calendar.drawer.collapseDetails") : t("calendar.drawer.expandDetails")}
        >
          <span className={cn("text-[10px] transition-transform", expanded && "rotate-90")}>▶</span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <DrawerItemTitleBlock item={item} />
            <TaskStatusIndicator
              status={item.status}
              dueDate={item.endDate ?? undefined}
              overdue={item.overdue}
              className="mt-0.5 shrink-0"
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="ml-6 mt-2 space-y-2 border-l border-dashed border-gray-200 pl-3 dark:border-gray-700">
          {loading && <p className="text-xs text-gray-400">{t("calendar.drawer.loadingDetails")}</p>}
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
  const { t } = useI18n();

  if (items.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-gray-400">{t("calendar.emptyDay")}</p>;
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
