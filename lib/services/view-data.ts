import {
  getEffectiveEndDate,
  shouldShowInCalendar,
  shouldShowInGantt,
} from "@/lib/content-router";
import { formatDateOnly, formatPlanDateTime } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { getContributionsInRange } from "@/lib/services/contribution";
import { isPlanOverdue, type PlanOverdueNode } from "@/lib/gantt-plan-status";
import type { GanttContribution, GanttItem, CalendarItem } from "@/types";

function parseRange(from?: string | null, to?: string | null) {
  const today = new Date();
  const defaultFrom = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const defaultTo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 4, 0));
  const fromDate = from ? new Date(from + "T00:00:00.000Z") : defaultFrom;
  const toDate = to ? new Date(to + "T23:59:59.999Z") : defaultTo;
  return { fromDate, toDate };
}

function overlapsRange(start: string, end: string, from: Date, to: Date): boolean {
  const s = new Date(start + "T00:00:00.000Z");
  const e = new Date(end + "T23:59:59.999Z");
  return s <= to && e >= from;
}

type PlanRow = {
  id: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  parentPlanId: string | null;
  status: string;
  color: string | null;
};

function findAnchorDate(
  planId: string | null,
  byId: Map<string, PlanRow>,
  fallback: string,
): string {
  let cur = planId;
  while (cur) {
    const p = byId.get(cur);
    if (!p) break;
    const start = formatDateOnly(p.startDate);
    if (start) return start;
    cur = p.parentPlanId;
  }
  return fallback;
}

function hasScheduledAncestor(planId: string | null, onGantt: Set<string>, byId: Map<string, PlanRow>): boolean {
  let cur = planId;
  while (cur) {
    if (onGantt.has(cur)) return true;
    cur = byId.get(cur)?.parentPlanId ?? null;
  }
  return false;
}

export async function getGanttItems(
  userId: string,
  from?: string | null,
  to?: string | null,
): Promise<GanttItem[]> {
  const { fromDate, toDate } = parseRange(from, to);
  const rangeFromStr = from ?? formatDateOnly(fromDate)!;

  const allPlans = await prisma.plan.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      parentPlanId: true,
      status: true,
      color: true,
    },
  });

  const byId = new Map(allPlans.map((p) => [p.id, p]));
  const items: GanttItem[] = [];
  const onGantt = new Set<string>();

  for (const plan of allPlans) {
    const startDate = formatDateOnly(plan.startDate);
    const endDate = formatDateOnly(plan.endDate);
    const routable = { startDate, endDate };
    if (!shouldShowInGantt(routable) || !startDate) continue;

    const { effectiveEnd, isVirtualEnd } = getEffectiveEndDate({
      startDate,
      dueDate: endDate,
    });
    if (!effectiveEnd || !overlapsRange(startDate, effectiveEnd, fromDate, toDate)) continue;

    items.push({
      id: plan.id,
      title: plan.title,
      startDate,
      endDate,
      effectiveEnd,
      isVirtualEnd,
      parentId: plan.parentPlanId,
      status: plan.status,
      color: plan.color,
    });
    onGantt.add(plan.id);
  }

  for (const plan of allPlans) {
    if (plan.startDate || !plan.parentPlanId) continue;
    if (!hasScheduledAncestor(plan.parentPlanId, onGantt, byId)) continue;
    if (onGantt.has(plan.id)) continue;

    const anchor = findAnchorDate(plan.parentPlanId, byId, rangeFromStr);
    items.push({
      id: plan.id,
      title: plan.title,
      startDate: anchor,
      endDate: null,
      effectiveEnd: anchor,
      isVirtualEnd: false,
      parentId: plan.parentPlanId,
      status: plan.status,
      color: plan.color,
      isUnscheduled: true,
    });
    onGantt.add(plan.id);
  }

  return items.sort((a, b) => {
    if (a.isUnscheduled !== b.isUnscheduled) return a.isUnscheduled ? 1 : -1;
    return a.startDate.localeCompare(b.startDate);
  });
}

export async function getGanttData(
  userId: string,
  from?: string | null,
  to?: string | null,
): Promise<{ items: GanttItem[]; contributions: GanttContribution[] }> {
  const items = await getGanttItems(userId, from, to);
  const contributions = await getContributionsInRange(userId, from, to);

  const planIds = new Set(items.map((i) => i.id));

  for (const c of contributions) {
    if (planIds.has(c.planId)) continue;

    const plan = await prisma.plan.findFirst({
      where: { id: c.planId, userId },
    });
    if (!plan || !plan.startDate) continue;

    const planContribs = contributions.filter((x) => x.planId === c.planId);
    const dates = planContribs
      .flatMap((x) => [x.occurredOn, x.occurredEndOn ?? x.occurredOn])
      .sort();
    const startDate = dates[0]!;
    const endDate = dates[dates.length - 1]!;

    items.push({
      id: plan.id,
      title: plan.title,
      startDate,
      effectiveEnd: endDate,
      isVirtualEnd: startDate === endDate,
      parentId: plan.parentPlanId,
      status: plan.status,
      color: plan.color,
      contributionOnly: true,
    });
    planIds.add(plan.id);
  }

  const visiblePlanIds = new Set(items.map((i) => i.id));

  return {
    items: items.sort((a, b) => {
      if (a.isUnscheduled !== b.isUnscheduled) return a.isUnscheduled ? 1 : -1;
      return a.startDate.localeCompare(b.startDate);
    }),
    contributions: contributions.filter((c) => visiblePlanIds.has(c.planId)),
  };
}

export async function getCalendarItems(
  userId: string,
  from?: string | null,
  to?: string | null,
): Promise<CalendarItem[]> {
  const { fromDate, toDate } = parseRange(from, to);
  const items: CalendarItem[] = [];

  const plans = await prisma.plan.findMany({
    where: { userId, startDate: { not: null }, status: { not: "archived" } },
    orderBy: { startDate: "asc" },
  });

  const planNodes = new Map<string, PlanOverdueNode>();
  for (const plan of plans) {
    const startIso = formatPlanDateTime(plan.startDate);
    const endIso = formatPlanDateTime(plan.endDate);
    const { isVirtualEnd } = getEffectiveEndDate({
      startDate: startIso ?? undefined,
      dueDate: endIso ?? undefined,
    });
    planNodes.set(plan.id, {
      status: plan.status,
      endDate: endIso,
      isVirtualEnd,
      parentId: plan.parentPlanId,
    });
  }

  for (const plan of plans) {
    const startDate = formatDateOnly(plan.startDate);
    const endDate = formatDateOnly(plan.endDate);
    if (!startDate || !shouldShowInCalendar({ startDate, endDate })) continue;

    const endForRange = endDate ?? startDate;
    if (!overlapsRange(startDate, endForRange, fromDate, toDate)) continue;

    const node = planNodes.get(plan.id)!;
    items.push({
      id: plan.id,
      title: plan.title,
      startDate: plan.startDate?.toISOString() ?? startDate,
      endDate: plan.endDate?.toISOString() ?? endDate,
      status: plan.status,
      parentPlanId: plan.parentPlanId,
      overdue: isPlanOverdue(node, planNodes),
    });
  }

  return items.sort((a, b) => a.startDate.localeCompare(b.startDate));
}
