"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { CalendarDrawerItemList } from "@/components/calendar/calendar-drawer-item-list";
import { CalendarDayCreateActions } from "@/components/calendar/calendar-day-create-actions";
import { itemsOnDate } from "@/lib/calendar-display";
import { formatCalendarDayDrawerTitle } from "@/lib/i18n/calendar-helpers";
import type { CalendarItem } from "@/types";

/** 移动端日历底部详情区：占半屏、推挤上方日历，内容可竖向滚动 */
export function CalendarMobileDaySheet({
  dateStr,
  items,
  onClose,
  detailExpandable = false,
  onDataChange,
}: {
  dateStr: string;
  items: CalendarItem[];
  onClose: () => void;
  detailExpandable?: boolean;
  onDataChange?: () => void;
}) {
  const { t, locale } = useI18n();
  const dayItems = itemsOnDate(items, dateStr);

  return (
    <section
      className="flex h-[50dvh] max-h-[50dvh] shrink-0 flex-col overflow-hidden border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
      aria-labelledby="calendar-mobile-day-title"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <h2
          id="calendar-mobile-day-title"
          className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900 dark:text-gray-100"
        >
          {formatCalendarDayDrawerTitle(dateStr, dayItems.length, locale, t)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label={t("common.close")}
        >
          ✕
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <CalendarDrawerItemList items={dayItems} expandable={detailExpandable} />
        {onDataChange && (
          <CalendarDayCreateActions dateStr={dateStr} dayItems={dayItems} onSuccess={onDataChange} />
        )}
      </div>
    </section>
  );
}
