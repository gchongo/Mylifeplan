"use client";

import { cn } from "@/lib/utils";

/**
 * 甘特行展开：与 PC 相同，始终用 ▶，收起时 rotate-90 指向下方。
 * ▶ 向右 = 已展开，▼ 向下 = 已收起
 */
export function GanttRowExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
      <span
        className={cn(
          "block text-[10px] leading-none transition-transform duration-150",
          !expanded && "rotate-90",
        )}
        aria-hidden
      >
        ▶
      </span>
    </span>
  );
}

/** 工具栏时间导航：与 PC 相同用 ‹ ›，竖向时间轴仅旋转方向 */
export function GanttToolbarNavArrow({
  direction,
  orientation = "horizontal",
}: {
  direction: "prev" | "next";
  orientation?: "horizontal" | "vertical";
}) {
  const glyph = direction === "prev" ? "‹" : "›";
  return (
    <span
      className={cn(
        "inline-block text-sm leading-none",
        orientation === "vertical" && (direction === "prev" ? "-rotate-90" : "rotate-90"),
      )}
      aria-hidden
    >
      {glyph}
    </span>
  );
}
