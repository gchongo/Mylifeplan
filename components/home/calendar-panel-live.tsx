"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDayDrawer } from "@/components/calendar/calendar-day-drawer";
import {
  CalendarScrollView,
  type CalendarScrollViewHandle,
} from "@/components/calendar/calendar-scroll-view";
import {
  CalendarDisplayPicker,
  useCalendarDisplayMode,
} from "@/components/calendar/calendar-display-picker";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { CalendarToolbarControls } from "@/components/calendar/calendar-toolbar-controls";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Loading } from "@/components/ui/feedback";
import {
  formatEventSchedule,
  itemAccent,
  itemsOnDate,
} from "@/lib/calendar-display";
import {
  formatMonthTitle,
  initialMonthWindow,
  monthKeyFromDate,
  rangeForMonths,
  type MonthKey,
} from "@/lib/calendar-month-grid";
import type { CalendarItem } from "@/types";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

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
  const dow = anchor.getUTCDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  const start = new Date(anchor);
  start.setUTCDate(anchor.getUTCDate() - mondayOffset);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    days: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
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
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
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
  const [drawerDate, setDrawerDate] = useState<string | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<CalendarScrollViewHandle>(null);

  const handleMonthsChange = useCallback((months: MonthKey[]) => {
    setLoadedMonths(months);
  }, []);

  const handleVisibleMonthChange = useCallback((key: MonthKey) => {
    setVisibleMonth(key);
    setViewYear(key.year);
    setViewMonth(key.month);
  }, []);

  const { from, to, label } = useMemo(() => {
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
  }, [viewMode, loadedMonths, visibleMonth, viewYear, viewMonth, viewDay, weekAnchor]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, [from, to]);

  const dayStr = toDateStr(viewYear, viewMonth, viewDay);
  const weekDays = weekRange(weekAnchor).days;
  const dayItems = itemsOnDate(items, dayStr);

  function goToday() {
    const now = new Date();
    setViewYear(now.getUTCFullYear());
    setViewMonth(now.getUTCMonth());
    setViewDay(now.getUTCDate());
    setWeekAnchor(now);
    setSelectedDate(now.toISOString().slice(0, 10));
    setVisibleMonth(monthKeyFromDate(now));
    if (viewMode === "month") scrollRef.current?.scrollToToday();
  }

  function prev() {
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
      setSelectedDate(d.toISOString().slice(0, 10));
    }
  }

  function next() {
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
      setSelectedDate(d.toISOString().slice(0, 10));
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

  const weekCellMin = fullPage ? "min-h-[8rem]" : "min-h-[5rem]";

  return (
    <Card className={cn("flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden", className)}>
      {!fullPage && (
        <CardHeader className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 space-y-0 pb-2">
          <CardTitle className="min-w-0 truncate">日历 · 看执行</CardTitle>
          <div className="flex items-center gap-2">
            <CalendarToolbarControls
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onPrev={prev}
              onNext={next}
              onToday={goToday}
            />
            {viewMode === "month" && (
              <CalendarDisplayPicker value={displayMode} onChange={setDisplayMode} />
            )}
          </div>
          <PanelExpandButton href="/calendar" label="日历" />
        </CardHeader>
      )}

      <CardContent
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          fullPage ? "p-0" : "p-3 pt-0",
        )}
      >
        <CalendarDayDrawer
          dateStr={drawerDate}
          items={items}
          open={drawerDate !== null}
          onClose={closeDayDrawer}
          detailExpandable={fullPage}
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
            {loading && viewMode !== "month" && <Loading label="加载日历…" />}
            {loading && viewMode === "month" && items.length === 0 && (
              <Loading label="加载日历…" />
            )}
            {!loading && items.length === 0 && viewMode !== "month" && (
              <EmptyState title="暂无安排" description="创建带开始日期的任务或计划后会显示在这里。" />
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
                      更新中…
                    </span>
                  </div>
                )}
              </div>
            )}
            {!loading && viewMode === "week" && (
              <div className="grid min-h-0 flex-1 grid-cols-7 gap-px overflow-y-auto bg-gray-100 text-xs">
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
              <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                {dayItems.length === 0 ? (
                  <li className="px-4 py-6 text-sm text-gray-400">当天暂无安排</li>
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
            )}
          </div>
        </CalendarDayDrawer>
      </CardContent>
    </Card>
  );
}
