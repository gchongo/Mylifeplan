import { ganttPlanBarHeightPx } from "@/lib/plan-color";

/** 列内计划条左右留白（便于横向滑动） */
export const MOBILE_PLAN_COLUMN_PAD_X = 4;

/** 移动端计划列宽：与 PC 条高一致 + 少量 padding */
export function mobilePlanColumnWidth(depth: number): number {
  return ganttPlanBarHeightPx(depth) + MOBILE_PLAN_COLUMN_PAD_X * 2;
}

export function mobilePlanBarWidthPx(depth: number): number {
  return ganttPlanBarHeightPx(depth);
}

export function mobilePlanGridWidth(rows: { gapBefore: number; depth: number }[]): number {
  return rows.reduce((sum, row) => sum + row.gapBefore + mobilePlanColumnWidth(row.depth), 0);
}
