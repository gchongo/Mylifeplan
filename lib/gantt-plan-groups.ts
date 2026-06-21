import { resolveVisualStatus, type VisualStatusKey } from "@/lib/task-status-style";
import type { GanttItem } from "@/types";

/** 组框内边距：避免标题/子条贴边 */
export const GROUP_FRAME_PAD = 5;

export interface GanttRowGroupMeta {
  gapBefore: number;
  height: number;
  rootId: string;
}

export interface PlanGroupLayout {
  rootId: string;
  top: number;
  height: number;
  rowCount: number;
}

export interface PlanGroupVisualStyle {
  frameBorder: string;
  frameBg: string;
  labelStripe: string;
  labelBg: string;
}

const GROUP_STYLES: Record<VisualStatusKey, PlanGroupVisualStyle> = {
  todo: {
    frameBorder: "border-amber-300/80 dark:border-amber-500/40",
    frameBg: "bg-amber-50/25 dark:bg-amber-950/15",
    labelStripe: "border-l-amber-400",
    labelBg: "bg-amber-50/25 dark:bg-amber-950/15",
  },
  in_progress: {
    frameBorder: "border-blue-300/80 dark:border-blue-500/40",
    frameBg: "bg-blue-50/25 dark:bg-blue-950/15",
    labelStripe: "border-l-blue-500",
    labelBg: "bg-blue-50/25 dark:bg-blue-950/15",
  },
  done: {
    frameBorder: "border-emerald-300/80 dark:border-emerald-500/40",
    frameBg: "bg-emerald-50/25 dark:bg-emerald-950/15",
    labelStripe: "border-l-emerald-500",
    labelBg: "bg-emerald-50/25 dark:bg-emerald-950/15",
  },
  archived: {
    frameBorder: "border-gray-300/80 dark:border-gray-500/40",
    frameBg: "bg-gray-50/30 dark:bg-gray-900/20",
    labelStripe: "border-l-gray-400",
    labelBg: "bg-gray-50/25 dark:bg-gray-900/15",
  },
  overdue: {
    frameBorder: "border-red-300/80 dark:border-red-500/40",
    frameBg: "bg-red-50/25 dark:bg-red-950/15",
    labelStripe: "border-l-red-500",
    labelBg: "bg-red-50/25 dark:bg-red-950/15",
  },
};

/** 组内子计划条：虚线保留，背景更轻，避免与大框双层边框感 */
export const GROUP_CHILD_BAR_SHELL: Record<VisualStatusKey, string> = {
  todo: "border border-dashed border-amber-400/55 bg-white/75 dark:bg-gray-900/55 shadow-none",
  in_progress:
    "border border-dashed border-blue-500/55 bg-white/75 dark:bg-gray-900/55 shadow-none",
  done: "border border-dashed border-emerald-500/55 bg-white/75 dark:bg-gray-900/55 shadow-none",
  archived: "border border-dashed border-gray-400/55 bg-white/75 dark:bg-gray-900/55 shadow-none",
  overdue: "border border-dashed border-red-500/55 bg-white/75 dark:bg-gray-900/55 shadow-none",
};

export function getPlanGroupVisualStyle(
  rootItem: GanttItem,
  getDisplayStatus: (item: GanttItem) => string,
): PlanGroupVisualStyle {
  const visual = resolveVisualStatus(
    rootItem.status,
    rootItem.endDate,
    getDisplayStatus(rootItem),
  );
  return GROUP_STYLES[visual];
}

export function rowOffsetTop(rows: Array<{ gapBefore: number; height: number }>, index: number): number {
  let y = 0;
  for (let i = 0; i < index; i++) {
    y += rows[i]!.gapBefore + rows[i]!.height;
  }
  return y;
}

/** 每个一级计划及其当前可见后代 → 一组；至少 2 行才绘制时间轴组框 */
export function buildPlanGroupLayouts(rows: GanttRowGroupMeta[]): PlanGroupLayout[] {
  const groups: PlanGroupLayout[] = [];
  let i = 0;
  while (i < rows.length) {
    const rootId = rows[i]!.rootId;
    let j = i + 1;
    while (j < rows.length && rows[j]!.rootId === rootId) j++;
    const count = j - i;
    if (count >= 2) {
      const top = rowOffsetTop(rows, i);
      groups.push({
        rootId,
        top,
        height: rowOffsetTop(rows, j) - top,
        rowCount: count,
      });
    }
    i = j;
  }
  return groups;
}
