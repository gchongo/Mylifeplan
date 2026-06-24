"use client";

import { useEffect, useRef, useState } from "react";
import { CALENDAR_VIEW_MODES, type CalendarViewMode } from "@/lib/calendar-display";
import { useI18n } from "@/components/i18n/i18n-provider";
import { localizeCalendarViewLabel } from "@/lib/i18n/calendar-helpers";
import { cn } from "@/lib/utils";

export function CalendarToolbarControls({
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  className,
}: {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <div className="flex items-center rounded-lg border border-gray-200 bg-white">
        <button
          type="button"
          onClick={onPrev}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
          aria-label={t("calendar.toolbar.prev")}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onToday}
          className="border-x border-gray-200 px-2.5 py-1 text-sm text-gray-800 hover:bg-gray-50"
        >
          {t("calendar.toolbar.today")}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
          aria-label={t("calendar.toolbar.next")}
        >
          ›
        </button>
      </div>

      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-800 hover:bg-gray-50"
        >
          {localizeCalendarViewLabel(t, viewMode)}
          <span className="text-[10px] text-gray-400">▼</span>
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {CALENDAR_VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  onViewModeChange(mode.id);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                  mode.id === viewMode && "bg-gray-100 font-medium",
                )}
              >
                {localizeCalendarViewLabel(t, mode.id)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
