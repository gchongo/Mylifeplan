"use client";

import Link from "next/link";
import {
  displayLimits,
  formatEventSchedule,
  itemAccent,
  itemsOnDate,
  type CalendarDisplayMode,
} from "@/lib/calendar-display";
import type { CalendarItem } from "@/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

/** Monday-based offset (0 = Mon … 6 = Sun) */
function mondayOffset(year: number, month: number) {
  const dow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

function itemHref(item: CalendarItem) {
  return item.type === "task" ? `/tasks/${item.id}` : `/plans/${item.id}`;
}

function DayNumber({
  day,
  isToday,
  isSelected,
}: {
  day: number;
  isToday: boolean;
  isSelected: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full text-xs font-semibold",
        isToday && "bg-red-500 text-white",
        !isToday && isSelected && "bg-gray-900 text-white",
        !isToday && !isSelected && "text-gray-800",
      )}
    >
      {day}
    </span>
  );
}

function CompactIndicators({ items }: { items: CalendarItem[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 5);
  if (shown.length === 1) {
    return (
      <div className="mt-auto flex justify-center pt-1">
        <span className={cn("h-1 w-4 rounded-full", itemAccent(shown[0]).bar)} title={shown[0].title} />
      </div>
    );
  }
  return (
    <div className="mt-auto flex justify-center gap-px overflow-hidden rounded-full pt-1" title={shown.map((i) => i.title).join("、")}>
      {shown.map((item) => (
        <span key={`${item.type}-${item.id}`} className={cn("h-1 flex-1 min-w-[3px] max-w-[0.75rem]", itemAccent(item).bar)} />
      ))}
    </div>
  );
}

function StackedBars({
  items,
  limit,
}: {
  items: CalendarItem[];
  limit: number;
}) {
  const shown = items.slice(0, limit);
  const rest = items.length - shown.length;
  return (
    <ul className="mt-1 space-y-0.5">
      {shown.map((item) => {
        const accent = itemAccent(item);
        return (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={itemHref(item)}
              className={cn("block h-1.5 rounded-full", accent.bar)}
              title={item.title}
            />
          </li>
        );
      })}
      {rest > 0 && <li className="text-[10px] leading-none text-gray-400">+{rest}</li>}
    </ul>
  );
}

function DetailedBlocks({
  items,
  limit,
}: {
  items: CalendarItem[];
  limit: number;
}) {
  const shown = items.slice(0, limit);
  const rest = items.length - shown.length;
  return (
    <ul className="mt-1 space-y-0.5">
      {shown.map((item) => {
        const accent = itemAccent(item);
        return (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={itemHref(item)}
              className={cn(
                "flex items-center gap-0.5 truncate rounded-md px-1 py-0.5 text-[10px] font-medium leading-tight text-white",
                accent.bar,
              )}
              title={`${item.title} · ${formatEventSchedule(item)}`}
            >
              <span className="truncate">{item.title}</span>
            </Link>
          </li>
        );
      })}
      {rest > 0 && <li className="text-[10px] text-gray-400">+{rest}</li>}
    </ul>
  );
}

function ListModeDot({ items }: { items: CalendarItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-auto flex justify-center gap-0.5 pt-0.5">
      {items.slice(0, 3).map((item) => (
        <span key={`${item.type}-${item.id}`} className={cn("h-1 w-3 rounded-full", itemAccent(item).bar)} />
      ))}
    </div>
  );
}

export function CalendarMonthView({
  year,
  month,
  items,
  displayMode,
  todayStr,
  selectedDate,
  onSelectDate,
  fullPage,
}: {
  year: number;
  month: number;
  items: CalendarItem[];
  displayMode: CalendarDisplayMode;
  todayStr: string;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  fullPage: boolean;
}) {
  const { show, cellMin } = displayLimits(displayMode, fullPage);
  const leading = mondayOffset(year, month);
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100 text-center text-[11px] text-gray-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 font-medium">
            {w}
          </div>
        ))}
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 grid grid-cols-7 gap-px overflow-y-auto bg-gray-100",
          displayMode === "list" && "shrink-0",
        )}
      >
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`e-${idx}`} className={cn("bg-white", cellMin)} />;
          }
          const ds = dateStr(day);
          const dayItems = itemsOnDate(items, ds);
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(ds)}
              className={cn(
                "flex flex-col bg-white p-1 text-left transition-colors hover:bg-gray-50/80",
                cellMin,
                isSelected && displayMode === "list" && "ring-1 ring-inset ring-brand-400",
              )}
            >
              <div className="flex justify-end">
                <DayNumber day={day} isToday={isToday} isSelected={isSelected && !isToday} />
              </div>
              {displayMode === "compact" && <CompactIndicators items={dayItems} />}
              {displayMode === "stacked" && <StackedBars items={dayItems} limit={show} />}
              {displayMode === "detailed" && <DetailedBlocks items={dayItems} limit={show} />}
              {displayMode === "list" && <ListModeDot items={dayItems} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarDayListPanel({
  dateStr,
  items,
  fullPage,
}: {
  dateStr: string;
  items: CalendarItem[];
  fullPage: boolean;
}) {
  const dayItems = itemsOnDate(items, dateStr);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden border-t border-gray-200 bg-gray-50/50",
        fullPage ? "flex-1" : "h-40 shrink-0",
      )}
    >
      <div className="shrink-0 border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
        {dateStr} · {dayItems.length} 项
      </div>
      <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto">
        {dayItems.length === 0 ? (
          <li className="px-3 py-4 text-sm text-gray-400">当天暂无安排</li>
        ) : (
          dayItems.map((item) => {
            const accent = itemAccent(item);
            return (
              <li key={`${item.type}-${item.id}`} className="border-b border-gray-100 last:border-0">
                <Link
                  href={itemHref(item)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white"
                >
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", accent.dot)} />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-900">{item.title}</span>
                  <span className="shrink-0 text-xs text-gray-400">{formatEventSchedule(item)}</span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
