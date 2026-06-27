"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { DrawerLayout, DrawerPanel, type DrawerPlacement } from "@/components/ui/drawer";
import { useMobileShell } from "@/hooks/use-mobile-shell";
import { CalendarDrawerItemList } from "@/components/calendar/calendar-drawer-item-list";
import { CalendarDayCreateActions } from "@/components/calendar/calendar-day-create-actions";
import { itemsOnDate } from "@/lib/calendar-display";
import { formatCalendarDayDrawerTitle } from "@/lib/i18n/calendar-helpers";
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
  const { t, locale } = useI18n();
  const dayItems = dateStr ? itemsOnDate(items, dateStr) : [];

  return (
    <DrawerPanel
      title={
        dateStr
          ? formatCalendarDayDrawerTitle(dateStr, dayItems.length, locale, t)
          : t("calendar.dayDrawerFallback")
      }
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
  panelWidthPx,
  onPanelWidthPxChange,
  panelMinWidthPx,
  panelMaxWidthPx,
  resizable = false,
  placement,
  push,
  panelHeightClass = "h-[50dvh]",
  children,
}: {
  dateStr: string | null;
  items: CalendarItem[];
  open: boolean;
  onClose: () => void;
  detailExpandable?: boolean;
  onDataChange?: () => void;
  panelWidthPx?: number;
  onPanelWidthPxChange?: (width: number) => void;
  panelMinWidthPx?: number;
  panelMaxWidthPx?: number;
  resizable?: boolean;
  placement?: DrawerPlacement;
  push?: boolean;
  panelHeightClass?: string;
  children: React.ReactNode;
}) {
  const isMobileShell = useMobileShell();
  const resolvedPlacement = placement ?? (isMobileShell ? "bottom" : "end");
  const resolvedPush = push ?? isMobileShell;

  return (
    <DrawerLayout
      open={open}
      onClose={onClose}
      placement={resolvedPlacement}
      push={resolvedPush}
      panelHeightClass={panelHeightClass}
      panelWidthPx={panelWidthPx}
      onPanelWidthPxChange={onPanelWidthPxChange}
      panelMinWidthPx={panelMinWidthPx}
      panelMaxWidthPx={panelMaxWidthPx}
      resizable={resizable && resolvedPlacement === "end"}
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
