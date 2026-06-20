"use client";

import { useEffect, useRef, useState } from "react";
import {
  CALENDAR_DISPLAY_MODES,
  loadCalendarDisplayMode,
  saveCalendarDisplayMode,
  type CalendarDisplayMode,
} from "@/lib/calendar-display";
import { cn } from "@/lib/utils";

function ModeIcon({ mode }: { mode: CalendarDisplayMode }) {
  const cls = "rounded-sm border border-current opacity-70";
  switch (mode) {
    case "compact":
      return (
        <span className="flex h-4 w-5 flex-col justify-end gap-0.5 p-0.5">
          <span className={cn(cls, "h-0.5 w-full bg-current")} />
        </span>
      );
    case "stacked":
      return (
        <span className="flex h-4 w-5 flex-col gap-0.5 p-0.5">
          <span className={cn(cls, "h-1 w-full bg-current")} />
          <span className={cn(cls, "h-1 w-3/4 bg-current")} />
        </span>
      );
    case "detailed":
      return (
        <span className="flex h-4 w-5 flex-col gap-0.5 p-0.5">
          <span className={cn(cls, "h-2.5 w-full bg-current")} />
          <span className="h-0.5 w-2/3 rounded bg-current opacity-50" />
        </span>
      );
  }
}

export function CalendarDisplayPicker({
  value,
  onChange,
  variant = "default",
}: {
  value: CalendarDisplayMode;
  onChange: (mode: CalendarDisplayMode) => void;
  variant?: "default" | "toolbar";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = CALENDAR_DISPLAY_MODES.find((m) => m.id === value)!;
  const isToolbar = variant === "toolbar";

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50",
          isToolbar ? "px-3 py-1.5 text-sm text-gray-800" : "px-2.5 py-1.5 text-xs text-gray-700",
        )}
        aria-label="日历显示方式"
      >
        {!isToolbar && <ModeIcon mode={value} />}
        <span>{current.label}</span>
        <span className="text-[10px] text-gray-400">▼</span>
      </button>
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg",
            isToolbar ? "min-w-[140px]" : "w-44 rounded-xl",
          )}
        >
          {CALENDAR_DISPLAY_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                onChange(mode.id);
                saveCalendarDisplayMode(mode.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 text-left hover:bg-gray-50",
                isToolbar ? "px-4 py-2 text-sm" : "px-3 py-2 text-sm",
                isToolbar && mode.id === value && "bg-gray-100 font-medium",
              )}
            >
              {!isToolbar && (
                <span className="text-gray-500">
                  <ModeIcon mode={mode.id} />
                </span>
              )}
              <span className={cn("flex-1", isToolbar ? "text-gray-800" : "text-gray-800")}>
                {mode.label}
              </span>
              {!isToolbar && value === mode.id && <span className="text-brand-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function useCalendarDisplayMode() {
  const [mode, setMode] = useState<CalendarDisplayMode>("stacked");
  useEffect(() => setMode(loadCalendarDisplayMode()), []);
  return [mode, setMode] as const;
}
