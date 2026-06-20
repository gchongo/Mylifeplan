import type { Task } from "@prisma/client";
import { getEffectiveEndDate } from "@/lib/content-router";
import { formatDateOnly } from "@/lib/dates";

export interface ParentDateBounds {
  startDate: string;
  maxEndDate: string;
  defaultStartDate: string;
  defaultDueDate: string;
}

export function getParentDateBounds(task: Pick<Task, "startDate" | "dueDate">): ParentDateBounds | null {
  const startDate = formatDateOnly(task.startDate);
  if (!startDate) return null;

  const dueStr = formatDateOnly(task.dueDate);
  const { effectiveEnd } = getEffectiveEndDate({
    startDate,
    dueDate: dueStr,
  });
  const maxEndDate = dueStr ?? effectiveEnd ?? startDate;

  return {
    startDate,
    maxEndDate,
    defaultStartDate: startDate,
    defaultDueDate: maxEndDate,
  };
}

export function validateChildDatesWithinParent(
  bounds: ParentDateBounds,
  startDate: string | null | undefined,
  dueDate: string | null | undefined,
): string | null {
  if (!startDate) return null;
  if (startDate < bounds.startDate) {
    return "子任务开始日期不能早于父任务开始日期";
  }
  if (dueDate && dueDate > bounds.maxEndDate) {
    return "子任务截止日期不能晚于父任务截止日期";
  }
  return null;
}
