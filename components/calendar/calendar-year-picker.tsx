"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { formatCalendarYearLabel, localizeCalendarMonthLabel } from "@/lib/i18n/calendar-helpers";
import { cn } from "@/lib/utils";

export function CalendarYearPicker({
  year,
  selectedMonth,
  selectedYear,
  todayYear,
  todayMonth,
  onYearChange,
  onSelectMonth,
}: {
  year: number;
  selectedMonth: number;
  selectedYear: number;
  todayYear: number;
  todayMonth: number;
  onYearChange: (year: number) => void;
  onSelectMonth: (month: number, year: number) => void;
}) {
  const { t, locale } = useI18n();
  const currentYearMonths = Array.from({ length: 12 }, (_, month) => ({ month, year }));
  const nextYearMonths = Array.from({ length: 4 }, (_, month) => ({ month, year: year + 1 }));
  const cells = [...currentYearMonths, ...nextYearMonths];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-gray-50/80 p-6">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">{formatCalendarYearLabel(year, locale, t)}</h2>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onYearChange(year - 1)}
            className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-200"
            aria-label={t("calendar.yearNav.prev")}
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onYearChange(year + 1)}
            className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-200"
            aria-label={t("calendar.yearNav.next")}
          >
            ▼
          </button>
        </div>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-4 gap-x-4 gap-y-6">
        {cells.map(({ month, year: cellYear }) => {
          const isNextYear = cellYear > year;
          const isSelected = selectedYear === cellYear && selectedMonth === month;
          const isToday = todayYear === cellYear && todayMonth === month;

          return (
            <button
              key={`${cellYear}-${month}`}
              type="button"
              onClick={() => onSelectMonth(month, cellYear)}
              className={cn(
                "flex h-10 items-center justify-center rounded-full text-sm transition-colors",
                isNextYear && !isSelected && "text-gray-300 hover:text-gray-500",
                !isNextYear && !isSelected && "text-gray-800 hover:bg-gray-200/80",
                isSelected && "bg-brand-500 font-medium text-white hover:bg-brand-600",
                isToday && !isSelected && "font-semibold text-brand-600",
              )}
            >
              {localizeCalendarMonthLabel(t, locale, month)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
