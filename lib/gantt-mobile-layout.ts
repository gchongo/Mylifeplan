import { ganttPlanBarHeightPx } from "@/lib/plan-color";

/** 竖排标题专用列宽（与进度条分列，避免与实际线重叠） */
export const MOBILE_TITLE_LANE_WIDTH = 15;

/** 列内计划条右侧留白 */
export const MOBILE_PLAN_COLUMN_PAD_X = 3;

/** 移动端计划列宽：标题道 + 条宽 + 留白 */
export function mobilePlanColumnWidth(depth: number): number {
  return MOBILE_TITLE_LANE_WIDTH + mobilePlanBarWidthPx(depth) + MOBILE_PLAN_COLUMN_PAD_X;
}

export function mobilePlanBarWidthPx(depth: number): number {
  return ganttPlanBarHeightPx(depth);
}

/** 进度条在列内的 left（px），位于标题道右侧 */
export function mobilePlanBarLeftPx(depth: number): number {
  return MOBILE_TITLE_LANE_WIDTH + Math.floor(MOBILE_PLAN_COLUMN_PAD_X / 2);
}

export function mobilePlanGridWidth(rows: { gapBefore: number; depth: number }[]): number {
  return rows.reduce((sum, row) => sum + row.gapBefore + mobilePlanColumnWidth(row.depth), 0);
}
