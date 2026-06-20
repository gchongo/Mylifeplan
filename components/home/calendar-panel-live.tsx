"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/ui/feedback";
import type { CalendarItem } from "@/types";

type ViewMode = "month" | "week" | "day";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

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
  const start = new Date(anchor);
  start.setUTCDate(anchor.getUTCDate() - dow);
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

function buildMonthGrid(year: number, month: number) {
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function itemOnDate(item: CalendarItem, dateStr: string): boolean {
  const start = item.startDate;
  const end = item.dueDate ?? item.startDate;
  return start <= dateStr && dateStr <= end;
}

function ItemLink({ item }: { item: CalendarItem }) {
  return (
    <Link
      href={item.type === "task" ? `/tasks/${item.id}` : `/plans/${item.id}`}
      className={`block truncate rounded px-0.5 ${
        item.type === "task" ? "bg-brand-100 text-brand-800" : "bg-purple-100 text-purple-800"
      }`}
      title={item.title}
    >
      {item.title}
    </Link>
  );
}

export function CalendarPanelLive() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [viewYear, setViewYear] = useState(today.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(today.getUTCMonth());
  const [viewDay, setViewDay] = useState(today.getUTCDate());
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const cells = buildMonthGrid(viewYear, viewMonth);
  const weekDays = weekRange(weekAnchor).days;
  const dayStr = toDateStr(viewYear, viewMonth, viewDay);
  const dayItems = items.filter((i) => itemOnDate(i, dayStr));

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
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-col gap-2 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>日历 · 看执行</CardTitle>
          <div className="flex gap-1">
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
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={prev}>
            ‹
          </Button>
          <span className="text-sm font-medium">{label}</span>
          <Button type="button" variant="ghost" size="sm" onClick={next}>
            ›
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading && <Loading label="加载日历…" />}
        {!loading && items.length === 0 && (
          <EmptyState title="暂无安排" description="创建带开始日期的任务或计划后会显示在这里。" />
        )}
        {!loading && viewMode === "month" && (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1 font-medium">
                  {w}
                </div>
              ))}
            </div>
            <div className="mt-1 min-h-0 flex-1 grid grid-cols-7 gap-1 overflow-y-auto text-xs">
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`e-${idx}`} className="min-h-[4rem] rounded bg-transparent" />;
                }
                const ds = toDateStr(viewYear, viewMonth, day);
                const dayItems = items.filter((i) => itemOnDate(i, ds));
                const isTodayCell = ds === todayStr;
                return (
                  <div
                    key={day}
                    className={`min-h-[4rem] rounded border p-1 ${
                      isTodayCell ? "border-brand-400 bg-brand-50" : "border-gray-100 bg-gray-50/80"
                    }`}
                  >
                    <div className="mb-0.5 text-right font-medium">{day}</div>
                    <ul className="space-y-0.5">
                      {dayItems.slice(0, 2).map((item) => (
                        <li key={`${item.type}-${item.id}`}>
                          <ItemLink item={item} />
                        </li>
                      ))}
                      {dayItems.length > 2 && (
                        <li className="text-[10px] text-gray-400">+{dayItems.length - 2}</li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {!loading && viewMode === "week" && (
          <div className="grid min-h-0 flex-1 grid-cols-7 gap-1 overflow-y-auto text-xs">
            {weekDays.map((ds) => {
              const dayItems = items.filter((i) => itemOnDate(i, ds));
              const d = parseInt(ds.slice(8, 10), 10);
              return (
                <div
                  key={ds}
                  className={`min-h-[6rem] rounded border p-1 ${
                    ds === todayStr ? "border-brand-400 bg-brand-50" : "border-gray-100"
                  }`}
                >
                  <div className="mb-1 text-center font-medium">{d}</div>
                  <ul className="space-y-0.5">
                    {dayItems.map((item) => (
                      <li key={`${item.type}-${item.id}`}>
                        <ItemLink item={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        {!loading && viewMode === "day" && (
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {dayItems.length === 0 ? (
              <li className="text-sm text-gray-500">当天暂无安排</li>
            ) : (
              dayItems.map((item) => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="rounded-lg border border-gray-100 px-3 py-2"
                >
                  <ItemLink item={item} />
                  <p className="mt-1 text-xs text-gray-400">
                    {item.startDate}
                    {item.dueDate && item.dueDate !== item.startDate ? ` → ${item.dueDate}` : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
