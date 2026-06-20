"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  CALENDAR_DISPLAY_MODES,
  CALENDAR_WIDE_BREAKPOINT,
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
    case "list":
      return (
        <span className="flex h-4 w-5 flex-col gap-0.5 p-0.5">
          <span className="h-0.5 w-full rounded bg-current" />
          <span className="h-0.5 w-full rounded bg-current opacity-60" />
          <span className="h-0.5 w-full rounded bg-current opacity-40" />
        </span>
      );
  }
}

export function CalendarDisplayPicker({
  value,
  onChange,
}: {
  value: CalendarDisplayMode;
  onChange: (mode: CalendarDisplayMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = CALENDAR_DISPLAY_MODES.find((m) => m.id === value)!;

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
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
        aria-label="日历显示方式"
      >
        <ModeIcon mode={value} />
        <span>{current.label}</span>
        <span className="text-[10px] text-gray-400">▼</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {CALENDAR_DISPLAY_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                onChange(mode.id);
                saveCalendarDisplayMode(mode.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <span className="text-gray-500">
                <ModeIcon mode={mode.id} />
              </span>
              <span className="flex-1 text-gray-800">{mode.label}</span>
              {value === mode.id && <span className="text-brand-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function useCalendarDisplayMode() {
  const [mode, setMode] = useState<CalendarDisplayMode>("list");
  useEffect(() => setMode(loadCalendarDisplayMode()), []);
  return [mode, setMode] as const;
}

/** Minimum content width to place calendar and day list side by side. */
export const CALENDAR_HORIZONTAL_LIST_MIN_WIDTH = 640;

export function useHorizontalCalendarList(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  const [horizontal, setHorizontal] = useState(false);

  useEffect(() => {
    if (!active) {
      setHorizontal(false);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const update = (width: number) => {
      setHorizontal(width >= CALENDAR_HORIZONTAL_LIST_MIN_WIDTH);
    };

    update(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, active]);

  return horizontal;
}
