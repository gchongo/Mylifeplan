"use client";

import { cn } from "@/lib/utils";

/** 移动端日历 + 详情抽屉：严格 50/50 分屏，抽屉向上展开时日历只占上半区 */
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
      <div
        className={cn(
          "min-h-0 shrink-0 overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none",
        )}
        style={{ height: open ? "50%" : "100%" }}
      >
        {calendar}
      </div>
      <div
        className={cn(
          "min-h-0 shrink-0 overflow-hidden border-t border-gray-200 bg-white transition-[height] duration-300 ease-out dark:border-gray-800 dark:bg-gray-950 motion-reduce:transition-none",
          !open && "border-t-transparent",
        )}
        style={{ height: open ? "50%" : "0%" }}
        aria-hidden={!open}
      >
        {open ? sheet : null}
      </div>
    </div>
  );
}
