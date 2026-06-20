"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDisplayPicker } from "@/components/calendar/calendar-display-picker";
import {
  CALENDAR_VIEW_MODES,
  type CalendarDisplayMode,
  type CalendarViewMode,
} from "@/lib/calendar-display";
import { cn } from "@/lib/utils";

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
  const [viewOpen, setViewOpen] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const currentView = CALENDAR_VIEW_MODES.find((m) => m.id === viewMode)!;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (viewRef.current && !viewRef.current.contains(e.target as Node)) setViewOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 py-2">
      <span className="text-sm font-medium text-gray-800">{periodLabel}</span>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={onPrev}
            className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            aria-label="上一段"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onToday}
            className="border-x border-gray-200 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
          >
            今天
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            aria-label="下一段"
          >
            ›
          </button>
        </div>

        <div ref={viewRef} className="relative">
          <button
            type="button"
            onClick={() => setViewOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
          >
            {currentView.label}
            <span className="text-[10px] text-gray-400">▼</span>
          </button>
          {viewOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {CALENDAR_VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    onViewModeChange(mode.id);
                    setViewOpen(false);
                  }}
                  className={cn(
                    "block w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                    mode.id === viewMode && "bg-gray-100 font-medium",
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>

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
