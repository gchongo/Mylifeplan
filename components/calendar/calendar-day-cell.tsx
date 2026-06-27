"use client";

import {
  displayLimits,
  formatEventSchedule,
  itemAccent,
  itemsOnDate,
  type CalendarDisplayMode,
} from "@/lib/calendar-display";
import { toDateStr } from "@/lib/calendar-month-grid";
import type { CalendarItem } from "@/types";
import { cn } from "@/lib/utils";

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
        !isToday && !isSelected && "text-gray-800 dark:text-gray-200",
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
          key={`${item.id}`}
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
        <li key={`${item.id}`}>
          <span className={cn("block h-1.5 rounded-full", itemAccent(item).bar)} title={item.title} />
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
        <li key={`${item.id}`}>
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

export function CalendarDayCell({
  year,
  month,
  day,
  items,
  displayMode,
  fullPage,
  todayStr,
  selectedDate,
  onSelectDate,
  cellMinOverride,
}: {
  year: number;
  month: number;
  day: number;
  items: CalendarItem[];
  displayMode: CalendarDisplayMode;
  fullPage: boolean;
  todayStr: string;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  cellMinOverride?: string;
}) {
  const { show, cellMin: defaultCellMin } = displayLimits(displayMode, fullPage);
  const cellMin = cellMinOverride ?? defaultCellMin;
  const ds = toDateStr(year, month, day);
  const dayItems = itemsOnDate(items, ds);
  const isToday = ds === todayStr;
  const isSelected = ds === selectedDate;

  return (
    <button
      type="button"
      data-date={ds}
      onClick={() => onSelectDate(ds)}
      className={cn(
        "flex flex-col bg-white p-1.5 text-left transition-colors hover:bg-gray-50/80 dark:bg-gray-900 dark:hover:bg-gray-800/80",
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
}

export function CalendarEmptyDayCell({ cellMin }: { cellMin: string }) {
  return <div className={cn("bg-white dark:bg-gray-900", cellMin)} />;
}

export function useCalendarCellMin(displayMode: CalendarDisplayMode, fullPage: boolean) {
  return displayLimits(displayMode, fullPage).cellMin;
}
