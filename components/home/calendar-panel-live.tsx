"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDayListPanel, CalendarMonthView } from "@/components/calendar/calendar-month-view";
import {
  CalendarDisplayPicker,
  useCalendarDisplayMode,
  useHorizontalCalendarList,
} from "@/components/calendar/calendar-display-picker";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { PanelExpandButton } from "@/components/home/panel-expand-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/ui/feedback";
import {
  formatEventSchedule,
  itemAccent,
  itemsOnDate,
} from "@/lib/calendar-display";
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
  return item.type === "task" ? `/tasks/${item.id}` : `/plans/${item.id}`;
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
  const [displayMode, setDisplayMode] = useCalendarDisplayMode();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [viewYear, setViewYear] = useState(today.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(today.getUTCMonth());
  const [viewDay, setViewDay] = useState(today.getUTCDate());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const monthLayoutRef = useRef<HTMLDivElement>(null);
  const containerWide = useHorizontalCalendarList(monthLayoutRef, viewMode === "month" && !loading);
  const horizontalList = displayMode === "list" && containerWide;

  const { from, to, label } = useMemo(() => {
    if (viewMode === "month") {
      const r = monthRange(viewYear, viewMonth);
      return { ...r, label: `${viewYear}年${viewMonth + 1}月` };
    }
    if (viewMode === "week") {
      const r = weekRange(weekAnchor);
      return { from: r.from, to: r.to, label: `${r.from} ~ ${r.to}` };
    }
    const ds = toDateStr(viewYear, viewMonth, viewDay);
    return { from: ds, to: ds, label: ds };
  }, [viewMode, viewYear, viewMonth, viewDay, weekAnchor]);

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
  }

  function prev() {
    if (viewMode === "month") {
      if (viewMonth === 0) {
        setViewYear((y) => y - 1);
        setViewMonth(11);
      } else setViewMonth((m) => m - 1);
    } else if (viewMode === "week") {
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
      if (viewMonth === 11) {
        setViewYear((y) => y + 1);
        setViewMonth(0);
      } else setViewMonth((m) => m + 1);
    } else if (viewMode === "week") {
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

  function handleSelectDate(ds: string) {
    setSelectedDate(ds);
    const d = parseDate(ds);
    setViewYear(d.getUTCFullYear());
    setViewMonth(d.getUTCMonth());
    setViewDay(d.getUTCDate());
  }

  const weekCellMin = fullPage ? "min-h-[8rem]" : "min-h-[5rem]";

  return (
    <Card className={cn("flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden", className)}>
      {!fullPage && (
        <CardHeader className="shrink-0 space-y-2 pb-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <CardTitle className="min-w-0 truncate">日历 · 看执行</CardTitle>
            <PanelExpandButton href="/calendar" label="日历" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {(["month", "week", "day"] as ViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  size="sm"
                  variant={viewMode === mode ? "primary" : "ghost"}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === "month" ? "月" : mode === "week" ? "周" : "日"}
                </Button>
              ))}
              {viewMode === "month" && (
                <CalendarDisplayPicker value={displayMode} onChange={setDisplayMode} />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={goToday}>
                今天
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={prev}>
                ‹
              </Button>
              <span className="text-sm font-medium">{label}</span>
              <Button type="button" variant="ghost" size="sm" onClick={next}>
                ›
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          fullPage ? "p-0" : "p-3 pt-0",
        )}
      >
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
        {loading && <Loading label="加载日历…" />}
        {!loading && items.length === 0 && viewMode !== "month" && (
          <EmptyState title="暂无安排" description="创建带开始日期的任务或计划后会显示在这里。" />
        )}
        {!loading && viewMode === "month" && (
          <div
            ref={monthLayoutRef}
            className={cn(
              "flex min-h-0 flex-1 overflow-hidden bg-white",
              fullPage ? "" : "rounded-xl border border-gray-200",
              horizontalList ? "flex-row" : "flex-col",
            )}
          >
            {items.length === 0 && displayMode !== "list" && (
              <p className="shrink-0 px-3 py-2 text-xs text-gray-400">本月暂无安排</p>
            )}
            <CalendarMonthView
              year={viewYear}
              month={viewMonth}
              items={items}
              displayMode={displayMode}
              todayStr={todayStr}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              fullPage={fullPage}
              horizontalList={horizontalList}
            />
            {displayMode === "list" && (
              <CalendarDayListPanel
                dateStr={selectedDate}
                items={items}
                fullPage={fullPage}
                horizontal={horizontalList}
              />
            )}
          </div>
        )}
        {!loading && viewMode === "week" && (
          <div className="grid min-h-0 flex-1 grid-cols-7 gap-px overflow-y-auto bg-gray-100 text-xs">
            {weekDays.map((ds) => {
              const list = itemsOnDate(items, ds);
              const d = parseInt(ds.slice(8, 10), 10);
              const isToday = ds === todayStr;
              return (
                <div
                  key={ds}
                  className={cn("flex flex-col bg-white p-1", weekCellMin)}
                >
                  <div className="mb-1 flex justify-center">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday ? "bg-red-500 text-white" : "text-gray-800",
                      )}
                    >
                      {d}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {list.map((item) => {
                      const accent = itemAccent(item);
                      return (
                        <li key={`${item.type}-${item.id}`}>
                          <Link
                            href={itemHref(item)}
                            className={cn("block rounded-md px-1 py-0.5 text-[10px] text-white", accent.bar)}
                          >
                            <span className="line-clamp-2">{item.title}</span>
                          </Link>
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
                  <li key={`${item.type}-${item.id}`} className="border-b border-gray-100 last:border-0">
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
      </CardContent>
    </Card>
  );
}
