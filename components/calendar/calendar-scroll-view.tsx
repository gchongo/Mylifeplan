"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  CalendarDayCell,
  CalendarEmptyDayCell,
  useCalendarCellMin,
} from "@/components/calendar/calendar-day-cell";
import type { CalendarDisplayMode } from "@/lib/calendar-display";
import {
  addMonths,
  buildMonthCells,
  extendMonths,
  formatMonthTitle,
  initialMonthWindow,
  monthKeyFromDate,
  monthKeyId,
  type MonthKey,
  WEEKDAY_LABELS,
} from "@/lib/calendar-month-grid";
import type { CalendarItem } from "@/types";
import { cn } from "@/lib/utils";

const PRELOAD_MONTHS = 3;
const EDGE_THRESHOLD_PX = 280;

export type CalendarScrollViewHandle = {
  scrollToToday: () => void;
  scrollByMonth: (delta: number) => void;
};

export const CalendarScrollView = forwardRef<
  CalendarScrollViewHandle,
  {
    items: CalendarItem[];
    displayMode: CalendarDisplayMode;
    todayStr: string;
    selectedDate: string;
    onSelectDate: (dateStr: string) => void;
    onVisibleMonthChange: (key: MonthKey) => void;
    onMonthsChange: (months: MonthKey[]) => void;
    fullPage: boolean;
  }
>(function CalendarScrollView(
  {
    items,
    displayMode,
    todayStr,
    selectedDate,
    onSelectDate,
    onVisibleMonthChange,
    onMonthsChange,
    fullPage,
  },
  ref,
) {
  const todayKey = monthKeyFromDate(new Date(`${todayStr}T12:00:00Z`));
  const [months, setMonths] = useState<MonthKey[]>(() => initialMonthWindow(todayKey));
  const scrollRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLElement>>(new Map());
  const prependingRef = useRef(false);
  const didInitialScroll = useRef(false);
  const cellMin = useCalendarCellMin(displayMode, fullPage);

  useEffect(() => {
    onMonthsChange(months);
  }, [months, onMonthsChange]);

  const setMonthRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) monthRefs.current.set(id, el);
    else monthRefs.current.delete(id);
  }, []);

  const updateVisibleMonth = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const rootTop = root.getBoundingClientRect().top;
    let best: { key: MonthKey; dist: number } | null = null;

    for (const key of months) {
      const el = monthRefs.current.get(monthKeyId(key));
      if (!el) continue;
      const dist = Math.abs(el.getBoundingClientRect().top - rootTop - 36);
      if (!best || dist < best.dist) best = { key, dist };
    }
    if (best) onVisibleMonthChange(best.key);
  }, [months, onVisibleMonthChange]);

  const prependMonths = useCallback(() => {
    const root = scrollRef.current;
    if (!root || prependingRef.current) return;
    prependingRef.current = true;
    const prevHeight = root.scrollHeight;
    setMonths((prev) => extendMonths(prev, PRELOAD_MONTHS, "start"));
    requestAnimationFrame(() => {
      const nextHeight = root.scrollHeight;
      root.scrollTop += nextHeight - prevHeight;
      prependingRef.current = false;
    });
  }, []);

  const appendMonths = useCallback(() => {
    setMonths((prev) => extendMonths(prev, PRELOAD_MONTHS, "end"));
  }, []);

  const handleScroll = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    updateVisibleMonth();
    if (root.scrollTop < EDGE_THRESHOLD_PX) prependMonths();
    if (root.scrollHeight - root.scrollTop - root.clientHeight < EDGE_THRESHOLD_PX) appendMonths();
  }, [appendMonths, prependMonths, updateVisibleMonth]);

  useEffect(() => {
    const outer = outerRef.current;
    const scroll = scrollRef.current;
    if (!outer || !scroll) return;

    function onWheel(e: WheelEvent) {
      const maxScroll = scroll.scrollHeight - scroll.clientHeight;
      if (maxScroll <= 1) return;
      const prev = scroll.scrollTop;
      const next = Math.max(0, Math.min(maxScroll, prev + e.deltaY));
      if (next === prev) return;
      e.preventDefault();
      scroll.scrollTop = next;
    }

    outer.addEventListener("wheel", onWheel, { passive: false });
    return () => outer.removeEventListener("wheel", onWheel);
  }, [months, displayMode, fullPage]);

  useLayoutEffect(() => {
    if (didInitialScroll.current) return;
    const root = scrollRef.current;
    const todayEl = root?.querySelector(`[data-date="${todayStr}"]`);
    if (root && todayEl instanceof HTMLElement) {
      const rootRect = root.getBoundingClientRect();
      const elRect = todayEl.getBoundingClientRect();
      root.scrollTop += elRect.top - rootRect.top - root.clientHeight * 0.35;
      didInitialScroll.current = true;
      updateVisibleMonth();
    }
  }, [months, todayStr, updateVisibleMonth]);

  useImperativeHandle(ref, () => ({
    scrollToToday() {
      const root = scrollRef.current;
      const todayEl = root?.querySelector(`[data-date="${todayStr}"]`);
      if (root && todayEl instanceof HTMLElement) {
        todayEl.scrollIntoView({ block: "center", behavior: "smooth" });
        updateVisibleMonth();
      }
    },
    scrollByMonth(delta: number) {
      const root = scrollRef.current;
      if (!root) return;
      const firstVisible = months.find((key) => {
        const el = monthRefs.current.get(monthKeyId(key));
        if (!el) return false;
        const top = el.getBoundingClientRect().top;
        const rootTop = root.getBoundingClientRect().top;
        return top >= rootTop - 8 && top < rootTop + root.clientHeight * 0.5;
      });
      const anchor = firstVisible ?? monthKeyFromDate(new Date(`${todayStr}T12:00:00Z`));
      const target = addMonths(anchor, delta);
      const targetId = monthKeyId(target);
      if (!months.some((m) => monthKeyId(m) === targetId)) {
        setMonths((prev) =>
          [...prev, target].sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month)),
        );
        requestAnimationFrame(() => {
          monthRefs.current.get(targetId)?.scrollIntoView({ block: "start", behavior: "smooth" });
        });
      } else {
        monthRefs.current.get(targetId)?.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    },
  }));

  return (
    <div ref={outerRef} className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-10 grid shrink-0 grid-cols-7 border-b border-gray-200 bg-white text-center text-[11px] text-gray-500 shadow-sm">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1.5 font-medium">
            {w}
          </div>
        ))}
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gray-100"
        tabIndex={0}
      >
        {months.map((key, index) => {
          const id = monthKeyId(key);
          const showYear = index === 0 || months[index - 1]!.year !== key.year;
          const cells = buildMonthCells(key.year, key.month);
          const title = formatMonthTitle(key, showYear);
          const isCurrentMonth = key.year === todayKey.year && key.month === todayKey.month;

          return (
            <section key={id} ref={(el) => setMonthRef(id, el)} data-month-id={id} className="mb-1">
              <h3
                className={cn(
                  "sticky top-8 z-[5] bg-gray-100 px-3 py-2 text-base font-semibold",
                  isCurrentMonth ? "text-red-600" : "text-gray-900",
                )}
              >
                {title}
              </h3>
              <div className="grid grid-cols-7 gap-px">
                {cells.map((day, idx) => {
                  if (day === null) {
                    return <CalendarEmptyDayCell key={`e-${id}-${idx}`} cellMin={cellMin} />;
                  }
                  return (
                    <CalendarDayCell
                      key={`${id}-${day}`}
                      year={key.year}
                      month={key.month}
                      day={day}
                      items={items}
                      displayMode={displayMode}
                      fullPage={fullPage}
                      todayStr={todayStr}
                      selectedDate={selectedDate}
                      onSelectDate={onSelectDate}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
});

CalendarScrollView.displayName = "CalendarScrollView";
