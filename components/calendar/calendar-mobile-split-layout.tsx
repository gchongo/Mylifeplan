"use client";

import { cn } from "@/lib/utils";

/** 移动端日历 + 详情抽屉：上下分屏，日历不被遮挡 */
export function CalendarMobileSplitLayout({
  open,
  calendar,
  sheet,
  className,
}: {
  open: boolean;
  calendar: React.ReactNode;
  sheet: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden", className)}>
      <div className="min-h-0 flex-1 overflow-hidden">{calendar}</div>
      <div
        className={cn(
          "min-h-0 overflow-hidden border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950",
          open ? "flex-1" : "max-h-0 flex-[0] border-t-transparent",
        )}
        aria-hidden={!open}
      >
        {sheet}
      </div>
    </div>
  );
}
