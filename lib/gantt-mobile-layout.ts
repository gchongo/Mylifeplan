import { ganttPlanBarHeightPx } from "@/lib/plan-color";

/** 列内计划条左右留白（便于横向滑动） */
export const MOBILE_PLAN_COLUMN_PAD_X = 4;

/** 移动端计划列宽：条宽 + 左右 padding */
export function mobilePlanColumnWidth(depth: number): number {
  return mobilePlanBarWidthPx(depth) + MOBILE_PLAN_COLUMN_PAD_X * 2;
}

export function mobilePlanBarWidthPx(depth: number): number {
  return ganttPlanBarHeightPx(depth);
}

/** 进度条左缘（列内居中） */
export function mobilePlanBarLeftPx(depth: number): number {
  const bar = mobilePlanBarWidthPx(depth);
  return Math.floor((mobilePlanColumnWidth(depth) - bar) / 2);
}

/** 进度条水平中心 */
export function mobilePlanBarCenterPx(depth: number): number {
  return mobilePlanBarLeftPx(depth) + mobilePlanBarWidthPx(depth) / 2;
}

export function mobilePlanGridWidth(rows: { gapBefore: number; depth: number }[]): number {
  return rows.reduce((sum, row) => sum + row.gapBefore + mobilePlanColumnWidth(row.depth), 0);
}
