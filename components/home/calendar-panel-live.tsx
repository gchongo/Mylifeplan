"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/ui/feedback";
import type { CalendarItem } from "@/types";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function monthRange(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
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

export function CalendarPanelLive() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(today.getUTCMonth());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { from, to } = useMemo(
    () => monthRange(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, [from, to]);

  const byDay = useMemo(() => {
    const map = new Map<number, CalendarItem[]>();
    for (const item of items) {
      const d = parseInt(item.startDate.slice(8, 10), 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(item);
    }
    return map;
  }, [items]);

  const cells = buildMonthGrid(viewYear, viewMonth);
  const label = `${viewYear}年${viewMonth + 1}月`;

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const isToday = (day: number) =>
    day === today.getUTCDate() &&
    viewMonth === today.getUTCMonth() &&
    viewYear === today.getUTCFullYear();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle>日历 · 看执行</CardTitle>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={prevMonth}>
            ‹
          </Button>
          <span className="min-w-[5rem] text-center text-sm font-medium">{label}</span>
          <Button type="button" variant="ghost" size="sm" onClick={nextMonth}>
            ›
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading && <Loading label="加载日历…" />}
        {!loading && items.length === 0 && (
          <EmptyState title="本月暂无安排" description="创建带开始日期的任务或计划后会显示在这里。" />
        )}
        {!loading && (
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
                const dayItems = byDay.get(day) ?? [];
                return (
                  <div
                    key={day}
                    className={`min-h-[4rem] rounded border p-1 ${
                      isToday(day)
                        ? "border-brand-400 bg-brand-50"
                        : "border-gray-100 bg-gray-50/80"
                    }`}
                  >
                    <div
                      className={`mb-0.5 text-right font-medium ${
                        isToday(day) ? "text-brand-700" : "text-gray-600"
                      }`}
                    >
                      {day}
                    </div>
                    <ul className="space-y-0.5">
                      {dayItems.slice(0, 2).map((item) => (
                        <li key={`${item.type}-${item.id}`}>
                          <Link
                            href={
                              item.type === "task" ? `/tasks/${item.id}` : `/plans/${item.id}`
                            }
                            className={`block truncate rounded px-0.5 ${
                              item.type === "task"
                                ? "bg-brand-100 text-brand-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                            title={item.title}
                          >
                            {item.title}
                          </Link>
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
      </CardContent>
    </Card>
  );
}
