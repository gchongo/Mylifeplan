"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiJson } from "@/lib/client-api";
import { CalendarDayCreateActions } from "@/components/calendar/calendar-day-create-actions";
import { CalendarDayDrawer } from "@/components/calendar/calendar-day-drawer";
import { CalendarScrollView,
  type CalendarScrollViewHandle,
} from "@/components/calendar/calendar-scroll-view";
import { CalendarYearPicker } from "@/components/calendar/calendar-year-picker";
import {
  CalendarDisplayPicker,
  useCalendarDisplayMode,
} from "@/components/calendar/calendar-display-picker";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { CalendarToolbarControls } from "@/components/calendar/calendar-toolbar-controls";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatCalendarYearLabel } from "@/lib/i18n/calendar-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import {
  clampCalendarDrawerWidthPx,
  formatEventSchedule,
  itemAccent,
  itemsOnDate,
  loadCalendarDrawerWidthPx,
  maxCalendarDrawerWidthPx,
  saveCalendarDrawerWidthPx,
  CALENDAR_DRAWER_MIN_WIDTH_PX,
  type CalendarViewMode,
} from "@/lib/calendar-display";
import {
  formatMonthTitle,
  initialMonthWindow,
  monthKeyFromDate,
  rangeForMonths,
  type MonthKey,
} from "@/lib/calendar-month-grid";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { localDateStr } from "@/lib/dates";
import type { CalendarItem } from "@/types";
import { cn } from "@/lib/utils";

type ViewMode = CalendarViewMode;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function monthRange(year: number, month: number) {
  const from = toDateStr(year, month, 1);
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const to = toDateStr(year, month, lastDay);
  return { from, to };
}

function weekRange(anchor: Date) {
  const dow = anchor.getDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  start.setDate(anchor.getDate() - mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    from: localDateStr(start),
    to: localDateStr(end),
    days: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return localDateStr(d);
    }),
  };
}

function itemHref(item: CalendarItem) {
  return `/plans/${item.id}`;
}

export function CalendarPanelLive({
  fullPage = false,
  className,
}: {
  fullPage?: boolean;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const today = new Date();
  const todayStr = localDateStr(today);
  const todayMonth = monthKeyFromDate(today);
  const [displayMode, setDisplayMode] = useCalendarDisplayMode();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [viewYear, setViewYear] = useState(today.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(today.getUTCMonth());
  const [viewDay, setViewDay] = useState(today.getUTCDate());
  const [visibleMonth, setVisibleMonth] = useState<MonthKey>(todayMonth);
  const [loadedMonths, setLoadedMonths] = useState<MonthKey[]>(() =>
    initialMonthWindow(todayMonth),
  );
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [drawerDate, setDrawerDate] = useState<string | null>(() => (fullPage ? null : todayStr));
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<CalendarScrollViewHandle>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
  const [drawerWidthPx, setDrawerWidthPx] = useState(CALENDAR_DRAWER_MIN_WIDTH_PX);

  useEffect(() => {
    setDrawerWidthPx(loadCalendarDrawerWidthPx());
  }, []);

  useLayoutEffect(() => {
    const el = layoutRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setLayoutSize({ width: rect.width, height: rect.height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxDrawerWidthPx = useMemo(
    () =>
      layoutSize.width > 0 && layoutSize.height > 0
        ? maxCalendarDrawerWidthPx(layoutSize.width, layoutSize.height)
        : undefined,
    [layoutSize.width, layoutSize.height],
  );

  useEffect(() => {
    if (layoutSize.width <= 0 || layoutSize.height <= 0) return;
    setDrawerWidthPx((prev) =>
      clampCalendarDrawerWidthPx(prev, layoutSize.width, layoutSize.height),
    );
  }, [layoutSize.width, layoutSize.height]);

  const handleDrawerWidthChange = useCallback(
    (width: number) => {
      const next =
        layoutSize.width > 0 && layoutSize.height > 0
          ? clampCalendarDrawerWidthPx(width, layoutSize.width, layoutSize.height)
          : width;
      setDrawerWidthPx(next);
      saveCalendarDrawerWidthPx(next);
    },
    [layoutSize.width, layoutSize.height],
  );

  const handleMonthsChange = useCallback((months: MonthKey[]) => {
    setLoadedMonths(months);
  }, []);

  const handleVisibleMonthChange = useCallback((key: MonthKey) => {
    setVisibleMonth(key);
    setViewYear(key.year);
    setViewMonth(key.month);
  }, []);

  const { from, to, label } = useMemo(() => {
    if (viewMode === "year") {
      return {
        from: `${viewYear}-01-01`,
        to: `${viewYear}-12-31`,
        label: formatCalendarYearLabel(viewYear, locale, t),
      };
    }
    if (viewMode === "month") {
      const r = rangeForMonths(loadedMonths);
      return { ...r, label: formatMonthTitle(visibleMonth, true) };
    }
    if (viewMode === "week") {
      const r = weekRange(weekAnchor);
      return { from: r.from, to: r.to, label: `${r.from} ~ ${r.to}` };
    }
    const ds = toDateStr(viewYear, viewMonth, viewDay);
    return { from: ds, to: ds, label: ds };
  }, [viewMode, loadedMonths, visibleMonth, viewYear, viewMonth, viewDay, weekAnchor, locale, t]);

  const reloadCalendar = useCallback(() => {
    setLoading(true);
    apiJson<{ items?: CalendarItem[] }>(`/api/calendar?from=${from}&to=${to}`)
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    dispatchPlanUpdated();
  }, [from, to]);

  useEffect(() => {
    setLoading(true);
    apiJson<{ items?: CalendarItem[] }>(`/api/calendar?from=${from}&to=${to}`)
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [from, to]);

  const dayStr = toDateStr(viewYear, viewMonth, viewDay);
  const weekDays = weekRange(weekAnchor).days;
  const dayItems = itemsOnDate(items, dayStr);
  const weekCellMin = fullPage ? "min-h-[8rem]" : "min-h-[5rem]";

  function goToday() {
    const now = new Date();
    setViewYear(now.getUTCFullYear());
    setViewMonth(now.getUTCMonth());
    setViewDay(now.getUTCDate());
    setWeekAnchor(now);
    setSelectedDate(localDateStr(now));
    setVisibleMonth(monthKeyFromDate(now));
    if (viewMode === "month") scrollRef.current?.scrollToToday();
  }

  function selectYearMonth(month: number, year: number) {
    const key = { year, month };
    setViewYear(year);
    setViewMonth(month);
    setVisibleMonth(key);
    setLoadedMonths(initialMonthWindow(key));
    setViewMode("month");
    requestAnimationFrame(() => scrollRef.current?.scrollToMonth(key));
  }

  function prev() {
    if (viewMode === "year") {
      setViewYear((y) => y - 1);
      return;
    }
    if (viewMode === "month") {
      scrollRef.current?.scrollByMonth(-1);
      return;
    }
    if (viewMode === "week") {
      const d = new Date(weekAnchor);
      d.setUTCDate(d.getUTCDate() - 7);
      setWeekAnchor(d);
    } else {
      const d = parseDate(dayStr);
      d.setUTCDate(d.getUTCDate() - 1);
      setViewYear(d.getUTCFullYear());
      setViewMonth(d.getUTCMonth());
      setViewDay(d.getUTCDate());
      setSelectedDate(localDateStr(d));
    }
  }

  function next() {
    if (viewMode === "year") {
      setViewYear((y) => y + 1);
      return;
    }
    if (viewMode === "month") {
      scrollRef.current?.scrollByMonth(1);
      return;
    }
    if (viewMode === "week") {
      const d = new Date(weekAnchor);
      d.setUTCDate(d.getUTCDate() + 7);
      setWeekAnchor(d);
    } else {
      const d = parseDate(dayStr);
      d.setUTCDate(d.getUTCDate() + 1);
      setViewYear(d.getUTCFullYear());
      setViewMonth(d.getUTCMonth());
      setViewDay(d.getUTCDate());
      setSelectedDate(localDateStr(d));
    }
  }

  function openDayDrawer(ds: string) {
    setSelectedDate(ds);
    const d = parseDate(ds);
    setViewYear(d.getUTCFullYear());
    setViewMonth(d.getUTCMonth());
    setViewDay(d.getUTCDate());
    setDrawerDate(ds);
  }

  function closeDayDrawer() {
    setDrawerDate(null);
  }

  return (
    <Card className={cn("flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden", className)}>
      {!fullPage && (
        <CardHeader className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 space-y-0 pb-2">
          <CardTitle className="min-w-0 truncate">{t("calendar.homeTitle")}</CardTitle>
          <div className="flex items-center gap-2">
            <CalendarToolbarControls
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onPrev={prev}
              onNext={next}
              onToday={goToday}
            />
            {(viewMode === "month") && (
              <CalendarDisplayPicker value={displayMode} onChange={setDisplayMode} />
            )}
          </div>
          <PanelExpandButton href="/calendar" label={t("calendar.panelExpand")} />
        </CardHeader>
      )}

      <CardContent
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          fullPage ? "p-0" : "px-3 pb-3 pt-0",
        )}
      >
        <div ref={layoutRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <CalendarDayDrawer
          dateStr={drawerDate}
          items={items}
          open={drawerDate !== null}
          onClose={closeDayDrawer}
          detailExpandable={fullPage}
          onDataChange={reloadCalendar}
          panelWidthPx={drawerWidthPx}
          onPanelWidthPxChange={handleDrawerWidthChange}
          panelMinWidthPx={CALENDAR_DRAWER_MIN_WIDTH_PX}
          panelMaxWidthPx={maxDrawerWidthPx}
          resizable={drawerDate !== null}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {fullPage && (
              <CalendarToolbar
                periodLabel={label}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                displayMode={displayMode}
                onDisplayModeChange={setDisplayMode}
                onPrev={prev}
                onNext={next}
                onToday={goToday}
              />
            )}
            {loading && viewMode !== "month" && viewMode !== "year" && (
              <Loading label={t("calendar.loading")} />
            )}
            {loading && viewMode === "month" && items.length === 0 && (
              <Loading label={t("calendar.loading")} />
            )}
            {!loading && items.length === 0 && viewMode !== "month" && viewMode !== "year" && (
              <EmptyState title={t("calendar.emptyTitle")} description={t("calendar.emptyDescription")} />
            )}
            {viewMode === "year" && (
              <CalendarYearPicker
                year={viewYear}
                selectedMonth={visibleMonth.month}
                selectedYear={visibleMonth.year}
                todayYear={today.getUTCFullYear()}
                todayMonth={today.getUTCMonth()}
                onYearChange={setViewYear}
                onSelectMonth={selectYearMonth}
              />
            )}
            {viewMode === "month" && (
              <div
                className={cn(
                  "relative flex h-0 min-h-0 flex-1 flex-col overflow-hidden bg-white",
                  fullPage ? "" : "rounded-xl border border-gray-200",
                )}
              >
                <CalendarScrollView
                  ref={scrollRef}
                  items={items}
                  displayMode={displayMode}
                  todayStr={todayStr}
                  selectedDate={selectedDate}
                  onSelectDate={openDayDrawer}
                  onVisibleMonthChange={handleVisibleMonthChange}
                  onMonthsChange={handleMonthsChange}
                  fullPage={fullPage}
                />
                {loading && items.length > 0 && (
                  <div className="pointer-events-none absolute inset-x-0 top-10 z-20 flex justify-center">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs text-gray-500 shadow-sm">
                      {t("calendar.updating")}
                    </span>
                  </div>
                )}
              </div>
            )}
            {!loading && viewMode === "week" && (
              <div className="scrollbar-hide grid min-h-0 flex-1 grid-cols-7 gap-px overflow-y-auto overscroll-contain bg-gray-100 text-xs">
                {weekDays.map((ds) => {
                  const list = itemsOnDate(items, ds);
                  const d = parseInt(ds.slice(8, 10), 10);
                  const isToday = ds === todayStr;
                  const isSelected = ds === selectedDate;
                  return (
                    <div key={ds} className={cn("flex flex-col bg-white p-1", weekCellMin)}>
                      <div className="mb-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => openDayDrawer(ds)}
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold hover:ring-2 hover:ring-brand-200",
                            isToday && "bg-red-500 text-white",
                            !isToday && isSelected && "bg-gray-900 text-white",
                            !isToday && !isSelected && "text-gray-800",
                          )}
                        >
                          {d}
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {list.map((item) => {
                          const accent = itemAccent(item);
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => openDayDrawer(ds)}
                                className={cn(
                                  "block w-full rounded-md px-1 py-0.5 text-left text-[10px] text-white",
                                  accent.bar,
                                )}
                              >
                                <span className="line-clamp-2">{item.title}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
            {!loading && viewMode === "day" && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
                <ul className="scrollbar-hide min-h-0 flex-1 space-y-0 overflow-y-auto overscroll-contain">
                  {dayItems.length === 0 ? (
                    <li className="px-4 py-6 text-sm text-gray-400">{t("calendar.emptyDay")}</li>
                  ) : (
                    dayItems.map((item) => {
                      const accent = itemAccent(item);
                      return (
                        <li key={item.id} className="border-b border-gray-100 last:border-0">
                          <Link
                            href={itemHref(item)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                          >
                            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", accent.dot)} />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                              {item.title}
                            </span>
                            <span className="shrink-0 text-xs text-gray-400">
                              {formatEventSchedule(item)}
                            </span>
                          </Link>
                        </li>
                      );
                    })
                  )}
                </ul>
                <CalendarDayCreateActions
                  dateStr={dayStr}
                  dayItems={dayItems}
                  onSuccess={reloadCalendar}
                />
              </div>
            )}
          </div>
        </CalendarDayDrawer>
        </div>
      </CardContent>
    </Card>
  );
}
