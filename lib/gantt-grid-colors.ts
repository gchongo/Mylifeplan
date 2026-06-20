import type { TimelineColumn } from "@/lib/gantt-scale";

export const GRID_BANDS = [
  { bg: "bg-sky-50/60", border: "border-sky-200" },
  { bg: "bg-amber-50/60", border: "border-amber-200" },
  { bg: "bg-emerald-50/60", border: "border-emerald-200" },
  { bg: "bg-violet-50/60", border: "border-violet-200" },
  { bg: "bg-rose-50/60", border: "border-rose-200" },
  { bg: "bg-teal-50/60", border: "border-teal-200" },
];

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
