import { ganttPlanBarHeightPx } from "@/lib/plan-color";

/** 列内计划条左右留白 */
export const MOBILE_PLAN_COLUMN_PAD_X = 4;

/**
 * 计划列最小宽度：保证时间抽屉内 YY/M/D 单行完整显示（列宽可大于条宽，条仍居中）。
 * 日期只允许单行，禁止两行/截断布局。
 */
export const MOBILE_MIN_PLAN_COLUMN_WIDTH = 48;

/** 一级计划组之间的水平间隙（px） */
export const MOBILE_ROW_GROUP_GAP = 1;

/** 组间分割条样式（与 gap 宽度配套） */
export const MOBILE_PLAN_GROUP_GAP_CLASS =
  "shrink-0 border-r border-gray-300 bg-gray-100/90 dark:border-gray-600 dark:bg-gray-900/70";

/** 计划列右侧分割线（略深，便于对齐辨认） */
export const MOBILE_PLAN_COLUMN_BORDER_CLASS =
  "border-r border-gray-300 dark:border-gray-600";

/** 移动端竖条宽度 = PC 同级计划条高度（30 / 24 / 18） */
export function mobilePlanBarWidthPx(depth: number): number {
  return ganttPlanBarHeightPx(depth);
}

/** 移动端计划列宽：max(条宽+padding, 最小列宽)；条宽始终 = PC 条高 */
export function mobilePlanColumnWidth(depth: number): number {
  const barColumn = mobilePlanBarWidthPx(depth) + MOBILE_PLAN_COLUMN_PAD_X * 2;
  return Math.max(barColumn, MOBILE_MIN_PLAN_COLUMN_WIDTH);
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
