"use client";

import { cn } from "@/lib/utils";

/**
 * 甘特行展开：与 PC 相同，收起时 rotate-90 指向下方。
 * SVG 三角形几何中心对齐容器中心（避免 ▶ 字形的视觉偏移）。
 */
export function GanttRowExpandIcon({
  expanded,
  size = "md",
}: {
  expanded: boolean;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <svg
      viewBox="0 0 12 12"
      className={cn("shrink-0 transition-transform duration-150", dim, !expanded && "rotate-90")}
      aria-hidden
    >
      <path d="M4 2 L4 10 L10 6 Z" fill="currentColor" />
    </svg>
  );
}

/** 工具栏时间导航：竖向用 ▲ ▼；横向用 ‹ › */
export function GanttToolbarNavArrow({
  direction,
  orientation = "horizontal",
}: {
  direction: "prev" | "next";
  orientation?: "horizontal" | "vertical";
}) {
  if (orientation === "vertical") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center text-[10px] leading-none" aria-hidden>
        {direction === "prev" ? "▲" : "▼"}
      </span>
    );
  }
  return (
    <span className="inline-block text-sm leading-none" aria-hidden>
      {direction === "prev" ? "‹" : "›"}
    </span>
  );
}
