"use client";

import {
  CalendarDayCell,
  CalendarEmptyDayCell,
} from "@/components/calendar/calendar-day-cell";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useSettings } from "@/components/settings/settings-provider";
import type { CalendarDisplayMode } from "@/lib/calendar-display";
import type { MonthKey } from "@/lib/calendar-month-grid";
import {
  buildMonthWeekRows,
  formatCalendarWeekNumber,
} from "@/lib/calendar-week-number";
import { localizeSettingsWeekdayMonStart } from "@/lib/i18n/settings-helpers";
import type { CalendarItem } from "@/types";
import { cn } from "@/lib/utils";

/** 移动端单月网格：无无限滚动，iOS 风格固定月视图 */
export function CalendarMobileMonthView({
  month,
  items,
  displayMode,
  todayStr,
  selectedDate,
  onSelectDate,
  compact = false,
}: {
  month: MonthKey;
  items: CalendarItem[];
  displayMode: CalendarDisplayMode;
  todayStr: string;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  /** 抽屉打开时上半屏较矮，使用更紧凑的格子 */
  compact?: boolean;
}) {
  const { t } = useI18n();
  const { preferences } = useSettings();
  const weekPrefs = preferences.calendarWeekNumbers;
  const showWeekNumbers = weekPrefs.enabled;
  const weekColClass = weekPrefs.format === "week-label" ? "w-11 shrink-0" : "w-7 shrink-0";
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => localizeSettingsWeekdayMonStart(t, i));
  const cellMin = compact ? "min-h-[2.75rem]" : "min-h-[3.5rem]";
  const weekRows = buildMonthWeekRows(month.year, month.month);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white dark:bg-gray-900">
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
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gray-100 dark:bg-gray-950">
        {showWeekNumbers ? (
          <div className="flex flex-col gap-px">
            {weekRows.map((week, weekIndex) => (
              <div key={`w${weekIndex}`} className="flex gap-px">
                <div
                  className={cn(
                    weekColClass,
                    "flex items-start justify-center bg-gray-50 pt-1.5 text-[11px] font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400",
                    cellMin,
                  )}
                >
                  {formatCalendarWeekNumber(
                    weekPrefs,
                    month.year,
                    month.month,
                    week,
                    weekIndex,
                    weekRows.length,
                  )}
                </div>
                <div className="grid min-w-0 flex-1 grid-cols-7 gap-px">
                  {week.map((day, idx) => {
                    if (day === null) {
                      return <CalendarEmptyDayCell key={`e-${weekIndex}-${idx}`} cellMin={cellMin} />;
                    }
                    return (
                      <CalendarDayCell
                        key={`${month.year}-${month.month}-${day}`}
                        year={month.year}
                        month={month.month}
                        day={day}
                        items={items}
                        displayMode={displayMode}
                        fullPage
                        todayStr={todayStr}
                        selectedDate={selectedDate}
                        onSelectDate={onSelectDate}
                        cellMinOverride={cellMin}
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
                return <CalendarEmptyDayCell key={`e-${idx}`} cellMin={cellMin} />;
              }
              return (
                <CalendarDayCell
                  key={`${month.year}-${month.month}-${day}`}
                  year={month.year}
                  month={month.month}
                  day={day}
                  items={items}
                  displayMode={displayMode}
                  fullPage
                  todayStr={todayStr}
                  selectedDate={selectedDate}
                  onSelectDate={onSelectDate}
                  cellMinOverride={cellMin}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
