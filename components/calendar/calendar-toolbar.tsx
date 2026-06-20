"use client";

import Link from "next/link";
import { CalendarDisplayPicker } from "@/components/calendar/calendar-display-picker";
import { CalendarToolbarControls } from "@/components/calendar/calendar-toolbar-controls";
import type { CalendarDisplayMode, CalendarViewMode } from "@/lib/calendar-display";

export function CalendarToolbar({
  periodLabel,
  viewMode,
  onViewModeChange,
  displayMode,
  onDisplayModeChange,
  onPrev,
  onNext,
  onToday,
}: {
  periodLabel: string;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  displayMode: CalendarDisplayMode;
  onDisplayModeChange: (mode: CalendarDisplayMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 py-2">
      <span className="text-sm font-medium text-gray-800">{periodLabel}</span>

      <div className="flex items-center gap-2">
        <CalendarToolbarControls
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
        />

        {viewMode === "month" && (
          <CalendarDisplayPicker
            variant="toolbar"
            value={displayMode}
            onChange={onDisplayModeChange}
          />
        )}

        <Link
          href="/gantt"
          className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 sm:inline-block"
        >
          在甘特中管理
        </Link>
      </div>
    </div>
  );
}
