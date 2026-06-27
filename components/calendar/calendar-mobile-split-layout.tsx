"use client";

import { cn } from "@/lib/utils";

/**
 * 移动端日历分屏：抽屉从底部向上展开，日历区域同步收缩（各占可用高度 50%）。
 * 使用 grid 行高过渡，避免 50dvh 超出内容区导致“遮挡”感。
 */
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
    <div
      className={cn(
        "grid h-full min-h-0 w-full flex-1 overflow-hidden transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
        className,
      )}
      style={{ gridTemplateRows: open ? "minmax(0, 3fr) minmax(0, 2fr)" : "minmax(0, 1fr) 0fr" }}
    >
      <div className="min-h-0 overflow-hidden">{calendar}</div>
      <div
        className={cn(
          "min-h-0 overflow-hidden border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950",
          !open && "pointer-events-none border-t-transparent opacity-0",
          open && "opacity-100",
        )}
        aria-hidden={!open}
      >
        {sheet}
      </div>
    </div>
  );
}
