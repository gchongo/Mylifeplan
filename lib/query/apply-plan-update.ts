import { isPlanUnscheduled } from "@/lib/content-router";
import {
  syncGanttItemsFromPlanUpdate,
  type SerializedPlanForGantt,
} from "@/lib/gantt-plan-sync";
import type { KanbanPlan } from "@/lib/kanban-board";
import { getQueryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";
import type { CalendarItem, GanttContribution, GanttItem, PlanStatus } from "@/types";

type GanttQueryData = { items: GanttItem[]; contributions: GanttContribution[] };
type PlansQueryData = { plans?: KanbanPlan[] };
type CalendarQueryData = { items?: CalendarItem[] };

export function toGanttPlanSnapshot(plan: Record<string, unknown>): SerializedPlanForGantt {
  return {
    id: String(plan.id),
    title: String(plan.title ?? ""),
    startDate: (plan.startDate as string | null) ?? null,
    endDate: (plan.endDate as string | null) ?? null,
    actualStartDate: (plan.actualStartDate as string | null) ?? null,
    actualEndDate: (plan.actualEndDate as string | null) ?? null,
    parentPlanId: (plan.parentPlanId as string | null) ?? null,
    status: plan.status as string | undefined,
    color: (plan.color as string | null) ?? null,
  };
}

function mergeKanbanPlan(existing: KanbanPlan, plan: SerializedPlanForGantt): KanbanPlan {
  return {
    ...existing,
    title: plan.title,
    status: (plan.status as PlanStatus) ?? existing.status,
    startDate: plan.startDate,
    endDate: plan.endDate ?? null,
  };
}

function listKindFromPlansKey(queryKey: readonly unknown[]): "active" | "archived" {
  const filter = queryKey[1] as { status?: string } | undefined;
  return filter?.status === "archived" ? "archived" : "active";
}

function patchPlansQuery(
  old: PlansQueryData | undefined,
  plan: SerializedPlanForGantt,
  listKind: "active" | "archived",
): PlansQueryData | undefined {
  if (!old?.plans) return old;

  const isArchived = plan.status === "archived";
  const idx = old.plans.findIndex((p) => p.id === plan.id);

  if (listKind === "active") {
    if (isArchived) {
      if (idx === -1) return old;
      return { plans: old.plans.filter((p) => p.id !== plan.id) };
    }
    if (idx >= 0) {
      const plans = [...old.plans];
      plans[idx] = mergeKanbanPlan(plans[idx], plan);
      return { plans };
    }
    return old;
  }

  if (!isArchived) {
    if (idx === -1) return old;
    return { plans: old.plans.filter((p) => p.id !== plan.id) };
  }
  if (idx >= 0) {
    const plans = [...old.plans];
    plans[idx] = mergeKanbanPlan(plans[idx], plan);
    return { plans };
  }
  return old;
}

function patchCalendarQuery(
  old: CalendarQueryData | undefined,
  plan: SerializedPlanForGantt,
): CalendarQueryData | undefined {
  if (!old?.items) return old;

  const unscheduled = isPlanUnscheduled({ startDate: plan.startDate, endDate: plan.endDate });
  if (!plan.startDate || unscheduled || plan.status === "archived") {
    const next = old.items.filter((item) => item.id !== plan.id);
    return next.length === old.items.length ? old : { items: next };
  }

  const calItem: CalendarItem = {
    id: plan.id,
    title: plan.title,
    startDate: plan.startDate,
    endDate: plan.endDate,
    status: plan.status ?? "not_started",
    parentPlanId: plan.parentPlanId,
  };

  const idx = old.items.findIndex((item) => item.id === plan.id);
  if (idx >= 0) {
    const items = [...old.items];
    items[idx] = { ...items[idx], ...calItem };
    return { items };
  }
  return { items: [...old.items, calItem] };
}

/** PATCH 返回完整 plan 时，立即写入各视图 React Query 缓存（无需等 refetch） */
export function applyPlanUpdateToCache(rawPlan: Record<string, unknown>) {
  const qc = getQueryClient();
  const plan = toGanttPlanSnapshot(rawPlan);

  for (const [queryKey, data] of qc.getQueriesData<PlansQueryData>({
    queryKey: queryKeys.plans.all,
  })) {
    const listKind = listKindFromPlansKey(queryKey);
    const next = patchPlansQuery(data, plan, listKind);
    if (next && next !== data) {
      qc.setQueryData(queryKey, next);
    }
  }

  // 看板页常用 initialData，确保 active 列表 query 存在时也能命中
  const activeKey = queryKeys.plans.list();
  const activeData = qc.getQueryData<PlansQueryData>(activeKey);
  if (activeData?.plans) {
    const next = patchPlansQuery(activeData, plan, "active");
    if (next && next !== activeData) {
      qc.setQueryData(activeKey, next);
    }
  }

  for (const [queryKey, data] of qc.getQueriesData<GanttQueryData>({
    queryKey: queryKeys.gantt.all,
  })) {
    if (!data) continue;
    const from = String(queryKey[1] ?? "");
    qc.setQueryData<GanttQueryData>(queryKey, {
      ...data,
      items: syncGanttItemsFromPlanUpdate(data.items, plan, from),
    });
  }

  for (const [queryKey, data] of qc.getQueriesData<CalendarQueryData>({
    queryKey: queryKeys.calendar.all,
  })) {
    const next = patchCalendarQuery(data, plan);
    if (next && next !== data) {
      qc.setQueryData(queryKey, next);
    }
  }
}
