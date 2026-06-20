import {
  getEffectiveEndDate,
  shouldShowInCalendar,
  shouldShowInGantt,
} from "@/lib/content-router";
import { formatDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { getContributionsInRange } from "@/lib/services/contribution";
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

export async function getGanttItems(
  userId: string,
  from?: string | null,
  to?: string | null,
): Promise<GanttItem[]> {
  const { fromDate, toDate } = parseRange(from, to);
  const items: GanttItem[] = [];

  const [tasks, plans] = await Promise.all([
    prisma.task.findMany({
      where: { userId, startDate: { not: null }, status: { not: "archived" } },
      orderBy: { startDate: "asc" },
    }),
    prisma.plan.findMany({
      where: { userId, startDate: { not: null }, status: { not: "archived" } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  for (const task of tasks) {
    const startDate = formatDateOnly(task.startDate);
    const dueDate = formatDateOnly(task.dueDate);
    const routable = { startDate, dueDate };
    if (!shouldShowInGantt(routable) || !startDate) continue;

    const { effectiveEnd, isVirtualEnd } = getEffectiveEndDate(routable);
    if (!effectiveEnd || !overlapsRange(startDate, effectiveEnd, fromDate, toDate)) continue;

    items.push({
      id: task.id,
      title: task.title,
      startDate,
      dueDate,
      effectiveEnd,
      isVirtualEnd,
      type: "task",
      parentId: task.parentTaskId,
      status: task.status,
    });
  }

  for (const plan of plans) {
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
      effectiveEnd,
      isVirtualEnd,
      type: "plan",
      parentId: plan.parentPlanId,
      status: plan.status,
    });
  }

  return items.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function getGanttData(
  userId: string,
  from?: string | null,
  to?: string | null,
): Promise<{ items: GanttItem[]; contributions: GanttContribution[] }> {
  const items = await getGanttItems(userId, from, to);
  const contributions = await getContributionsInRange(userId, from, to);

  const planIds = new Set(items.filter((i) => i.type === "plan").map((i) => i.id));

  for (const c of contributions) {
    if (planIds.has(c.planId)) continue;

    const plan = await prisma.plan.findFirst({
      where: { id: c.planId, userId, status: { not: "archived" } },
    });
    if (!plan) continue;

    const planContribs = contributions.filter((x) => x.planId === c.planId);
    const dates = planContribs.map((x) => x.occurredOn).sort();
    const startDate = dates[0]!;
    const endDate = dates[dates.length - 1]!;

    items.push({
      id: plan.id,
      title: plan.title,
      startDate,
      effectiveEnd: endDate,
      isVirtualEnd: startDate === endDate,
      type: "plan",
      parentId: plan.parentPlanId,
      status: plan.status,
      contributionOnly: true,
    });
    planIds.add(plan.id);
  }

  return {
    items: items.sort((a, b) => a.startDate.localeCompare(b.startDate)),
    contributions,
  };
}

export async function getCalendarItems(
  userId: string,
  from?: string | null,
  to?: string | null,
): Promise<CalendarItem[]> {
  const { fromDate, toDate } = parseRange(from, to);
  const items: CalendarItem[] = [];

  const [tasks, plans] = await Promise.all([
    prisma.task.findMany({
      where: { userId, startDate: { not: null }, status: { not: "archived" } },
      orderBy: { startDate: "asc" },
    }),
    prisma.plan.findMany({
      where: { userId, startDate: { not: null }, status: { not: "archived" } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  for (const task of tasks) {
    const startDate = formatDateOnly(task.startDate);
    const dueDate = formatDateOnly(task.dueDate);
    if (!startDate || !shouldShowInCalendar({ startDate, dueDate })) continue;

    const endForRange = dueDate ?? startDate;
    if (!overlapsRange(startDate, endForRange, fromDate, toDate)) continue;

    items.push({
      id: task.id,
      title: task.title,
      startDate,
      dueDate,
      type: "task",
      status: task.status,
    });
  }

  for (const plan of plans) {
    const startDate = formatDateOnly(plan.startDate);
    const endDate = formatDateOnly(plan.endDate);
    if (!startDate || !shouldShowInCalendar({ startDate, endDate })) continue;

    const endForRange = endDate ?? startDate;
    if (!overlapsRange(startDate, endForRange, fromDate, toDate)) continue;

    items.push({
      id: plan.id,
      title: plan.title,
      startDate,
      dueDate: endDate,
      type: "plan",
      status: plan.status,
    });
  }

  return items.sort((a, b) => a.startDate.localeCompare(b.startDate));
}
