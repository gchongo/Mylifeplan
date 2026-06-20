import type { TimelineColumn } from "@/lib/gantt-scale";

export const GRID_BANDS = [
  { bg: "bg-sky-50/40", border: "border-sky-300" },
  { bg: "bg-amber-50/40", border: "border-amber-300" },
  { bg: "bg-emerald-50/40", border: "border-emerald-300" },
  { bg: "bg-violet-50/40", border: "border-violet-300" },
  { bg: "bg-rose-50/40", border: "border-rose-300" },
  { bg: "bg-teal-50/40", border: "border-teal-300" },
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
