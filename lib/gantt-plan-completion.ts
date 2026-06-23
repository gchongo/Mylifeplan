import type { GanttItem } from "@/types";

function activeChildren(itemId: string, allPlans: GanttItem[]): GanttItem[] {
  return allPlans.filter((p) => p.parentId === itemId && p.status !== "archived");
}

/**
 * 完成率（仅数字，不写「进行中」等状态文案）：
 * - 有子计划：已完成子计划数 / 子计划总数
 * - 叶子 done：100；not_started：0
 * - 叶子 in_progress / archived：null（显示 —，避免与状态列重复）
 */
export function planCompletionPercent(
  item: GanttItem,
  allPlans: GanttItem[],
): number | null {
  const children = activeChildren(item.id, allPlans);
  if (children.length > 0) {
    const done = children.filter((c) => c.status === "done").length;
    return Math.round((done / children.length) * 100);
  }

  if (item.status === "done") return 100;
  if (item.status === "not_started") return 0;
  return null;
}

export function formatCompletionPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value}%`;
}
