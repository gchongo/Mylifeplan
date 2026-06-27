"use client";

import { cn } from "@/lib/utils";

/** 移动端甘特条顶部的竖排标题（白框悬浮在条顶缘） */
export function GanttMobileBarTitle({
  title,
  depth = 0,
  onClick,
  className,
}: {
  title: string;
  depth?: number;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={cn(
        "pointer-events-auto absolute left-1/2 top-1 z-20 max-w-[calc(100%+4px)] -translate-x-1/2",
        "rounded-[3px] border border-white bg-white/95 px-[2px] py-1 shadow-sm",
        "dark:border-gray-100 dark:bg-white/90",
        onClick && "cursor-pointer hover:bg-white active:opacity-90",
        className,
      )}
      onClick={onClick}
      onPointerDown={onClick ? (e) => e.stopPropagation() : undefined}
      title={title}
    >
      <span
        className={cn(
          "block max-h-[5rem] overflow-hidden text-center text-gray-900",
          "text-[9px] leading-[1.12] tracking-tight",
          "[writing-mode:vertical-rl] [text-orientation:upright]",
          depth === 0 ? "font-semibold" : "font-medium text-gray-700",
        )}
      >
        {title}
      </span>
    </Tag>
  );
}
