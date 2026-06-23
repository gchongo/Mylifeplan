"use client";

import Link from "next/link";
import { DrawerLayout, DrawerPanel } from "@/components/ui/drawer";
import { CalendarDrawerItemList } from "@/components/calendar/calendar-drawer-item-list";
import { CalendarDayCreateActions } from "@/components/calendar/calendar-day-create-actions";
import { formatDayDrawerTitle, itemsOnDate } from "@/lib/calendar-display";
import type { CalendarItem } from "@/types";

function CalendarDayDrawerPanel({
  dateStr,
  items,
  onClose,
  detailExpandable,
  onDataChange,
}: {
  dateStr: string | null;
  items: CalendarItem[];
  onClose: () => void;
  detailExpandable: boolean;
  onDataChange?: () => void;
}) {
  const dayItems = dateStr ? itemsOnDate(items, dateStr) : [];

  return (
    <DrawerPanel
      title={dateStr ? formatDayDrawerTitle(dateStr, dayItems.length) : "当日安排"}
      onClose={onClose}
      className="p-0"
    >
      <CalendarDrawerItemList items={dayItems} expandable={detailExpandable} />
      {dateStr && onDataChange && (
        <CalendarDayCreateActions dateStr={dateStr} dayItems={dayItems} onSuccess={onDataChange} />
      )}
    </DrawerPanel>
  );
}

export function CalendarDayDrawer({
  dateStr,
  items,
  open,
  onClose,
  detailExpandable = false,
  onDataChange,
  widthClass,
  children,
}: {
  dateStr: string | null;
  items: CalendarItem[];
  open: boolean;
  onClose: () => void;
  detailExpandable?: boolean;
  onDataChange?: () => void;
  widthClass?: string;
  children: React.ReactNode;
}) {
  return (
    <DrawerLayout
      open={open}
      onClose={onClose}
      widthClass={widthClass}
      panel={
        <CalendarDayDrawerPanel
          dateStr={dateStr}
          items={items}
          onClose={onClose}
          detailExpandable={detailExpandable}
          onDataChange={onDataChange}
        />
      }
    >
      {children}
    </DrawerLayout>
  );
}
