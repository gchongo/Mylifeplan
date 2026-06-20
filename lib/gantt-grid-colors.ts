import type { TimelineColumn } from "@/lib/gantt-scale";

/** 统一灰色虚线，避免干扰任务条 */
export const GRID_BORDER = "border-r border-dashed border-gray-200/70";

/** 交替极淡背景，便于对齐大时间范围（无边框色） */
export const GRID_BANDS = [{ bg: "bg-white" }, { bg: "bg-gray-50/35" }];

export function buildColumnColorIndex(columns: TimelineColumn[]): Map<string, number> {
  const map = new Map<string, number>();
  let band = 0;
  let lastGroup = "";
  for (const col of columns) {
    if (col.topGroupKey !== lastGroup) {
      if (lastGroup) band++;
      lastGroup = col.topGroupKey;
    }
    map.set(col.key, band % GRID_BANDS.length);
  }
  return map;
}

export function spanColorIndex(columns: TimelineColumn[], spanKey: string): number {
  for (const col of columns) {
    if (col.topGroupKey === spanKey) {
      return buildColumnColorIndex(columns).get(col.key) ?? 0;
    }
  }
  return 0;
}
