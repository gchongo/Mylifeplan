"use client";

import Link from "next/link";
import { DrawerLayout, DrawerPanel } from "@/components/ui/drawer";
import { CalendarDrawerItemList } from "@/components/calendar/calendar-drawer-item-list";
import { formatDayDrawerTitle, itemsOnDate } from "@/lib/calendar-display";
import type { CalendarItem } from "@/types";

function CalendarDayDrawerPanel({
  dateStr,
  items,
  onClose,
  detailExpandable,
}: {
  dateStr: string | null;
  items: CalendarItem[];
  onClose: () => void;
  detailExpandable: boolean;
}) {
  const dayItems = dateStr ? itemsOnDate(items, dateStr) : [];

  return (
    <DrawerPanel
      title={dateStr ? formatDayDrawerTitle(dateStr, dayItems.length) : "当日安排"}
      onClose={onClose}
      className="p-0"
    >
      <CalendarDrawerItemList items={dayItems} expandable={detailExpandable} />
    </DrawerPanel>
  );
}

export function CalendarDayDrawer({
  dateStr,
  items,
  open,
  onClose,
  detailExpandable = false,
  children,
}: {
  dateStr: string | null;
  items: CalendarItem[];
  open: boolean;
  onClose: () => void;
  detailExpandable?: boolean;
  children: React.ReactNode;
}) {
  return (
    <DrawerLayout
      open={open}
      onClose={onClose}
      panel={
        <CalendarDayDrawerPanel
          dateStr={dateStr}
          items={items}
          onClose={onClose}
          detailExpandable={detailExpandable}
        />
      }
    >
      {children}
    </DrawerLayout>
  );
}
