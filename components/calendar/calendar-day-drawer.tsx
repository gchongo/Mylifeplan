"use client";

import Link from "next/link";
import { DrawerLayout, DrawerPanel } from "@/components/ui/drawer";
import {
  formatDayDrawerTitle,
  formatEventSchedule,
  itemAccent,
  itemsOnDate,
} from "@/lib/calendar-display";
import type { CalendarItem } from "@/types";
import { cn } from "@/lib/utils";

function itemHref(item: CalendarItem) {
  return item.type === "task" ? `/tasks/${item.id}` : `/plans/${item.id}`;
}

function CalendarDayDrawerPanel({
  dateStr,
  items,
  onClose,
}: {
  dateStr: string | null;
  items: CalendarItem[];
  onClose: () => void;
}) {
  const dayItems = dateStr ? itemsOnDate(items, dateStr) : [];

  return (
    <DrawerPanel
      title={dateStr ? formatDayDrawerTitle(dateStr, dayItems.length) : "当日安排"}
      onClose={onClose}
      className="p-0"
    >
      <ul className="divide-y divide-gray-100">
        {dayItems.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-gray-400">当天暂无安排</li>
        ) : (
          dayItems.map((item) => {
            const accent = itemAccent(item);
            return (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  href={itemHref(item)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                  onClick={onClose}
                >
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", accent.dot)} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">{formatEventSchedule(item)}</span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </DrawerPanel>
  );
}

export function CalendarDayDrawer({
  dateStr,
  items,
  open,
  onClose,
  children,
}: {
  dateStr: string | null;
  items: CalendarItem[];
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <DrawerLayout
      open={open}
      onClose={onClose}
      panel={<CalendarDayDrawerPanel dateStr={dateStr} items={items} onClose={onClose} />}
    >
      {children}
    </DrawerLayout>
  );
}
