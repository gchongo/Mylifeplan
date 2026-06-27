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
import { useI18n } from "@/components/i18n/i18n-provider";
import { useSettings } from "@/components/settings/settings-provider";
import type { CalendarDisplayMode } from "@/lib/calendar-display";
import {
  addMonths,
  extendMonths,
  initialMonthWindow,
  monthKeyFromDate,
  monthKeyId,
  type MonthKey,
} from "@/lib/calendar-month-grid";
import {
  buildMonthWeekRows,
  formatCalendarWeekNumber,
} from "@/lib/calendar-week-number";
import { localizeCalendarMonthLabel } from "@/lib/i18n/calendar-helpers";
import { localizeSettingsWeekdayMonStart } from "@/lib/i18n/settings-helpers";
import type { CalendarItem } from "@/types";
import { cn } from "@/lib/utils";

const PRELOAD_MONTHS = 3;
const EDGE_THRESHOLD_PX = 280;

export type CalendarScrollViewHandle = {
  scrollToToday: () => void;
  scrollByMonth: (delta: number) => void;
  scrollToMonth: (key: MonthKey) => void;
  scrollToDate: (dateStr: string) => void;
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
  const { t, locale } = useI18n();
  const todayKey = monthKeyFromDate(new Date(`${todayStr}T12:00:00Z`));
  const [months, setMonths] = useState<MonthKey[]>(() => initialMonthWindow(todayKey));
  const scrollRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLElement>>(new Map());
  const prependingRef = useRef(false);
  const didInitialScroll = useRef(false);
  const cellMin = useCalendarCellMin(displayMode, fullPage);
  const { preferences } = useSettings();
  const weekPrefs = preferences.calendarWeekNumbers;
  const showWeekNumbers = weekPrefs.enabled;
  const weekColClass = weekPrefs.format === "week-label" ? "w-11 shrink-0" : "w-7 shrink-0";
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => localizeSettingsWeekdayMonStart(t, i));
  const visibleMonthRef = useRef<MonthKey>(todayKey);

  function formatMonthSectionTitle(key: MonthKey, showYear: boolean): string {
    if (showYear) {
      return locale === "en-US"
        ? t("timeline.yearMonthEn", { year: key.year, month: key.month + 1 })
        : t("timeline.yearMonth", { year: key.year, month: key.month + 1 });
    }
    return localizeCalendarMonthLabel(t, locale, key.month);
  }

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
      const dist = Math.abs(el.getBoundingClientRect().top - rootTop);
      if (!best || dist < best.dist) best = { key, dist };
    }
    if (best) {
      visibleMonthRef.current = best.key;
      onVisibleMonthChange(best.key);
    }
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
    if (!outer || !scrollRef.current) return;

    function onWheel(e: WheelEvent) {
      const el = scrollRef.current;
      if (!el) return;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 1) return;
      const prev = el.scrollTop;
      const next = Math.max(0, Math.min(maxScroll, prev + e.deltaY));
      if (next === prev) return;
      e.preventDefault();
      el.scrollTop = next;
    }

    outer.addEventListener("wheel", onWheel, { passive: false });
    return () => outer.removeEventListener("wheel", onWheel);
  }, [months, displayMode, fullPage]);

  useLayoutEffect(() => {
    if (didInitialScroll.current) return;
    const root = scrollRef.current;
    const monthEl = monthRefs.current.get(monthKeyId(todayKey));
    if (root && monthEl) {
      root.scrollTop = monthEl.offsetTop;
      didInitialScroll.current = true;
      updateVisibleMonth();
    }
  }, [months, todayKey, updateVisibleMonth]);

  useImperativeHandle(ref, () => ({
    scrollToToday() {
      const root = scrollRef.current;
      const todayEl = root?.querySelector(`[data-date="${todayStr}"]`);
      if (root && todayEl instanceof HTMLElement) {
        todayEl.scrollIntoView({ block: "center", behavior: "smooth" });
        updateVisibleMonth();
      }
    },
    scrollToDate(dateStr: string) {
      const root = scrollRef.current;
      const el = root?.querySelector(`[data-date="${dateStr}"]`);
      if (root && el instanceof HTMLElement) {
        el.scrollIntoView({ block: "center", behavior: "auto" });
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
    scrollToMonth(key: MonthKey) {
      const targetId = monthKeyId(key);
      if (!months.some((m) => monthKeyId(m) === targetId)) {
        setMonths((prev) =>
          [...prev, key].sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month)),
        );
        requestAnimationFrame(() => {
          monthRefs.current.get(targetId)?.scrollIntoView({ block: "start", behavior: "auto" });
          updateVisibleMonth();
        });
      } else {
        monthRefs.current.get(targetId)?.scrollIntoView({ block: "start", behavior: "auto" });
        updateVisibleMonth();
      }
    },
  }));

  return (
    <div ref={outerRef} className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {showWeekNumbers ? (
        <div className="flex shrink-0 border-b border-gray-200 bg-white text-center text-[11px] text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          <div className={cn(weekColClass, "py-1.5 font-medium")}>{t("settings.weekNumber.weekHeader")}</div>
          <div className="grid min-w-0 flex-1 grid-cols-7">
            {weekdayLabels.map((w) => (
              <div key={w} className="py-1.5 font-medium">
                {w}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid shrink-0 grid-cols-7 border-b border-gray-200 bg-white text-center text-[11px] text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          {weekdayLabels.map((w) => (
            <div key={w} className="py-1.5 font-medium">
              {w}
            </div>
          ))}
        </div>
      )}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gray-100 dark:bg-gray-950"
        tabIndex={0}
      >
        {months.map((key, index) => {
          const id = monthKeyId(key);
          const showYear = index === 0 || months[index - 1]!.year !== key.year;
          const weekRows = buildMonthWeekRows(key.year, key.month);
          const title = formatMonthSectionTitle(key, showYear);
          const isCurrentMonth = key.year === todayKey.year && key.month === todayKey.month;

          return (
            <section key={id} ref={(el) => setMonthRef(id, el)} data-month-id={id} className="mb-1">
              <h3
                className={cn(
                  "bg-gray-100 px-3 py-2 text-base font-semibold dark:bg-gray-900",
                  isCurrentMonth ? "text-red-600" : "text-gray-900 dark:text-gray-100",
                )}
              >
                {title}
              </h3>
              {showWeekNumbers ? (
                <div className="flex flex-col gap-px">
                  {weekRows.map((week, weekIndex) => (
                    <div key={`${id}-w${weekIndex}`} className="flex gap-px">
                      <div
                        className={cn(
                          weekColClass,
                          "flex items-start justify-center bg-gray-50 pt-1.5 text-[11px] font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400",
                          cellMin,
                        )}
                      >
                        {formatCalendarWeekNumber(
                          weekPrefs,
                          key.year,
                          key.month,
                          week,
                          weekIndex,
                          weekRows.length,
                        )}
                      </div>
                      <div className="grid min-w-0 flex-1 grid-cols-7 gap-px">
                        {week.map((day, idx) => {
                          if (day === null) {
                            return (
                              <CalendarEmptyDayCell
                                key={`e-${id}-${weekIndex}-${idx}`}
                                cellMin={cellMin}
                              />
                            );
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-px">
                  {weekRows.flat().map((day, idx) => {
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
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
});

CalendarScrollView.displayName = "CalendarScrollView";
