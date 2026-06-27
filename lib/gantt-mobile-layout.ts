/** 列内计划条左右留白 */
export const MOBILE_PLAN_COLUMN_PAD_X = 2;

/** 一级计划组之间的水平间隙（px） */
export const MOBILE_ROW_GROUP_GAP = 1;

/** 移动端列内条宽（档 B，仅移动甘特；PC 仍用 plan-color 条高） */
const MOBILE_PLAN_BAR_WIDTH_BY_DEPTH = [40, 36, 32] as const;

/** 组间分割条样式（与 gap 宽度配套） */
export const MOBILE_PLAN_GROUP_GAP_CLASS =
  "shrink-0 border-r border-gray-300 bg-gray-100/90 dark:border-gray-600 dark:bg-gray-900/70";

/** 计划列右侧分割线（略深，便于对齐辨认） */
export const MOBILE_PLAN_COLUMN_BORDER_CLASS =
  "border-r border-gray-300 dark:border-gray-600";

/** 移动端计划列宽：条宽 + 左右 padding */
export function mobilePlanColumnWidth(depth: number): number {
  return mobilePlanBarWidthPx(depth) + MOBILE_PLAN_COLUMN_PAD_X * 2;
}

export function mobilePlanBarWidthPx(depth: number): number {
  const idx = Math.min(Math.max(depth, 0), MOBILE_PLAN_BAR_WIDTH_BY_DEPTH.length - 1);
  return MOBILE_PLAN_BAR_WIDTH_BY_DEPTH[idx]!;
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
