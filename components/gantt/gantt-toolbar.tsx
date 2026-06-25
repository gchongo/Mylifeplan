"use client";

import Link from "next/link";
import { GanttToolbarControls } from "@/components/gantt/gantt-toolbar-controls";
import type { GanttScaleId } from "@/lib/gantt-scale";

export function GanttToolbar({
  periodLabel,
  scale,
  onScaleChange,
  onPrev,
  onNext,
  onToday,
}: {
  periodLabel: string;
  scale: GanttScaleId;
  onScaleChange: (scale: GanttScaleId) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{periodLabel}</span>

      <div className="flex items-center gap-2">
        <GanttToolbarControls
          scale={scale}
          onScaleChange={onScaleChange}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
        />

        <Link
          href="/calendar"
          className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:inline-block"
        >
          在日历中管理
        </Link>
      </div>
    </div>
  );
}
