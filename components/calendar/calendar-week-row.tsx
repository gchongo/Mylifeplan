"use client";

import {
  displayLimits,
  formatEventSchedule,
  itemAccent,
  type CalendarDisplayMode,
} from "@/lib/calendar-display";
import {
  buildWeekMultiDaySegments,
  singleDayItemsOnDate,
  weekMultiDayLaneCount,
  type CalendarWeekSegment,
} from "@/lib/calendar-week-layout";
import { datePartOf } from "@/lib/dates";
import type { CalendarItem } from "@/types";
import { cn } from "@/lib/utils";
import { CalendarDayNumber } from "@/components/calendar/calendar-day-number";

const LANE_HEIGHT_STACKED = 6;
const LANE_HEIGHT_DETAILED = 18;
const LANE_GAP = 2;
/** 日期数字区高度（含 cell 上内边距），与下方跨天条带对齐 */
const DAY_HEADER_OFFSET_PX = 30;

function segmentRadius(kind: CalendarWeekSegment["kind"]) {
  switch (kind) {
    case "single":
      return "rounded-md";
    case "start":
      return "rounded-l-md rounded-r-none";
    case "end":
      return "rounded-l-none rounded-r-md";
    case "middle":
      return "rounded-none";
  }
}

function MultiDaySpanBar({
  segment,
  displayMode,
  onSelectDate,
}: {
  segment: CalendarWeekSegment;
  displayMode: CalendarDisplayMode;
  onSelectDate: (dateStr: string) => void;
}) {
  const accent = itemAccent(segment.item);
  const isDetailed = displayMode === "detailed";
  const openDate = datePartOf(segment.item.startDate) ?? "";

  return (
    <div
      className="pointer-events-auto min-w-0 px-px"
      style={{
        gridColumn: `${segment.colStart + 1} / span ${segment.colSpan}`,
        gridRow: segment.lane + 1,
      }}
    >
      <button
        type="button"
        onClick={() => openDate && onSelectDate(openDate)}
        className={cn(
          "block w-full truncate text-left text-white",
          accent.bar,
          segmentRadius(segment.kind),
          isDetailed ? "px-1 py-0.5 text-[10px] font-medium leading-tight" : "h-1.5",
        )}
        title={`${segment.item.title} · ${formatEventSchedule(segment.item)}`}
      >
        {isDetailed && segment.showTitle ? (
          <span className="truncate">{segment.item.title}</span>
        ) : (
          <span className="sr-only">{segment.item.title}</span>
        )}
      </button>
    </div>
  );
}

function SingleDayCompact({ items }: { items: CalendarItem[] }) {
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
          key={item.id}
          className={cn("h-1 max-w-[0.75rem] min-w-[3px] flex-1", itemAccent(item).bar)}
        />
      ))}
    </div>
  );
}

function SingleDayStacked({ items, limit }: { items: CalendarItem[]; limit: number }) {
  const shown = items.slice(0, limit);
  const rest = items.length - shown.length;
  return (
    <ul className="mt-1 space-y-0.5">
      {shown.map((item) => (
        <li key={item.id}>
          <span className={cn("block h-1.5 rounded-full", itemAccent(item).bar)} title={item.title} />
        </li>
      ))}
      {rest > 0 && <li className="text-[10px] leading-none text-gray-400">+{rest}</li>}
    </ul>
  );
}

function SingleDayDetailed({ items, limit }: { items: CalendarItem[]; limit: number }) {
  const shown = items.slice(0, limit);
  const rest = items.length - shown.length;
  return (
    <ul className="mt-1 space-y-0.5">
      {shown.map((item) => (
        <li key={item.id}>
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

export function CalendarWeekRow({
  weekDates,
  items,
  displayMode,
  fullPage,
  todayStr,
  selectedDate,
  onSelectDate,
}: {
  weekDates: (string | null)[];
  items: CalendarItem[];
  displayMode: CalendarDisplayMode;
  fullPage: boolean;
  todayStr: string;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}) {
  const { show, cellMin } = displayLimits(displayMode, fullPage);
  const segments = buildWeekMultiDaySegments(weekDates, items);
  const laneCount = weekMultiDayLaneCount(segments);
  const laneHeight =
    displayMode === "detailed" ? LANE_HEIGHT_DETAILED : LANE_HEIGHT_STACKED;
  const multiDayAreaHeight =
    laneCount > 0 ? laneCount * laneHeight + Math.max(0, laneCount - 1) * LANE_GAP : 0;

  return (
    <div className="relative">
      <div className="grid grid-cols-7 gap-px">
        {weekDates.map((dateStr, col) => {
          if (!dateStr) {
            return <div key={`empty-${col}`} className={cn("bg-white", cellMin)} />;
          }

          const day = parseInt(dateStr.slice(8, 10), 10);
          const singleDayItems = singleDayItemsOnDate(items, dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              type="button"
              data-date={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "flex flex-col bg-white p-1.5 text-left transition-colors hover:bg-gray-50/80",
                cellMin,
                isSelected && "ring-1 ring-inset ring-brand-400",
              )}
            >
              <div className="flex justify-end">
                <CalendarDayNumber day={day} isToday={isToday} isSelected={isSelected && !isToday} />
              </div>

              {laneCount > 0 && <div style={{ height: multiDayAreaHeight }} aria-hidden />}

              {displayMode === "compact" && <SingleDayCompact items={singleDayItems} />}
              {displayMode === "stacked" && <SingleDayStacked items={singleDayItems} limit={show} />}
              {displayMode === "detailed" && <SingleDayDetailed items={singleDayItems} limit={show} />}
            </button>
          );
        })}
      </div>

      {laneCount > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 grid grid-cols-7 gap-px"
          style={{
            top: DAY_HEADER_OFFSET_PX,
            height: multiDayAreaHeight,
            gridTemplateRows: `repeat(${laneCount}, ${laneHeight}px)`,
            rowGap: LANE_GAP,
          }}
        >
          {segments.map((segment) => (
            <MultiDaySpanBar
              key={`${segment.item.id}-${segment.colStart}-${segment.lane}`}
              segment={segment}
              displayMode={displayMode}
              onSelectDate={onSelectDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
