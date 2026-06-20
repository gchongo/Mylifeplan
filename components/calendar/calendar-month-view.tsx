"use client";

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
    <div
      className="mt-auto flex justify-center gap-px overflow-hidden rounded-full pt-1"
      title={shown.map((i) => i.title).join("、")}
    >
      {shown.map((item) => (
        <span
          key={`${item.type}-${item.id}`}
          className={cn("h-1 max-w-[0.75rem] min-w-[3px] flex-1", itemAccent(item).bar)}
        />
      ))}
    </div>
  );
}

function StackedBars({ items, limit }: { items: CalendarItem[]; limit: number }) {
  const shown = items.slice(0, limit);
  const rest = items.length - shown.length;
  return (
    <ul className="mt-1 space-y-0.5">
      {shown.map((item) => (
        <li key={`${item.type}-${item.id}`}>
          <span
            className={cn("block h-1.5 rounded-full", itemAccent(item).bar)}
            title={item.title}
          />
        </li>
      ))}
      {rest > 0 && <li className="text-[10px] leading-none text-gray-400">+{rest}</li>}
    </ul>
  );
}

function DetailedBlocks({ items, limit }: { items: CalendarItem[]; limit: number }) {
  const shown = items.slice(0, limit);
  const rest = items.length - shown.length;
  return (
    <ul className="mt-1 space-y-0.5">
      {shown.map((item) => (
        <li key={`${item.type}-${item.id}`}>
          <span
            className={cn(
              "flex items-center gap-0.5 truncate rounded-md px-1 py-0.5 text-[10px] font-medium leading-tight text-white",
              itemAccent(item).bar,
            )}
            title={`${item.title} · ${formatEventSchedule(item)}`}
          >
            <span className="truncate">{item.title}</span>
          </span>
        </li>
      ))}
      {rest > 0 && <li className="text-[10px] text-gray-400">+{rest}</li>}
    </ul>
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
      <div className="min-h-0 flex-1 grid grid-cols-7 gap-px overflow-y-auto bg-gray-100">
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
                isSelected && "ring-1 ring-inset ring-brand-400",
              )}
            >
              <div className="flex justify-end">
                <DayNumber day={day} isToday={isToday} isSelected={isSelected && !isToday} />
              </div>
              {displayMode === "compact" && <CompactIndicators items={dayItems} />}
              {displayMode === "stacked" && <StackedBars items={dayItems} limit={show} />}
              {displayMode === "detailed" && <DetailedBlocks items={dayItems} limit={show} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
