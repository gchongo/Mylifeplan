import { todayDateOnly } from "@/lib/task-status-style";
import type { GanttItem } from "@/types";

type PlanDueNode = Pick<GanttItem, "endDate" | "isVirtualEnd" | "parentId">;

function normalizeDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.length >= 10 ? value.slice(0, 10) : value;
}

/**
 * 甘特图状态圆点用的截止日期：
 * - 无明确结束（虚拟截止）→ 不因日期判超期
 * - 子计划且父计划尚未到期 → 不因子计划自己的日期判超期（仍在父计划时间范围内）
 * - 其余：用计划自己的 endDate
 */
export function resolveGanttPlanDueDate(
  item: PlanDueNode,
  planById: Map<string, PlanDueNode>,
): string | null | undefined {
  if (item.isVirtualEnd) return null;

  const own = normalizeDateOnly(item.endDate);
  if (!own) return null;
  if (!item.parentId) return own;

  const parent = planById.get(item.parentId);
  if (!parent) return own;

  const parentDue = parent.isVirtualEnd ? null : normalizeDateOnly(parent.endDate);
  if (parentDue && parentDue >= todayDateOnly()) {
    return null;
  }

  return own;
}
