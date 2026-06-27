"use client";

import { cn } from "@/lib/utils";

/** 移动端甘特条标题：竖排白框；sticky 时在纵向滚动中悬挂在可视区顶缘 */
export function GanttMobileBarTitle({
  title,
  depth = 0,
  onClick,
  sticky = false,
  className,
}: {
  title: string;
  depth?: number;
  onClick?: () => void;
  sticky?: boolean;
  className?: string;
}) {
  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={cn(
        "pointer-events-auto max-w-[calc(100%+6px)] bg-transparent px-0 py-0",
        "border-0 shadow-none",
        onClick && "cursor-pointer active:opacity-80",
        sticky
          ? "sticky top-0 z-30 mx-auto block w-fit"
          : "absolute left-1/2 top-1 z-20 -translate-x-1/2",
        className,
      )}
      onClick={onClick}
      onPointerDown={onClick ? (e) => e.stopPropagation() : undefined}
      title={title}
    >
      <span
        className={cn(
          "block max-h-[7rem] overflow-hidden text-center text-gray-900 dark:text-gray-100",
          "leading-[1.2] tracking-tight",
          "[writing-mode:vertical-rl] [text-orientation:upright]",
          "[text-shadow:0_0_4px_rgba(255,255,255,0.95),0_1px_3px_rgba(0,0,0,0.45)]",
          "dark:[text-shadow:0_0_4px_rgba(0,0,0,0.85),0_0_2px_rgba(255,255,255,0.35)]",
          depth === 0 ? "text-[13px] font-bold" : "text-[12px] font-semibold text-gray-800 dark:text-gray-200",
        )}
      >
        {title}
      </span>
    </Tag>
  );
}

/** 与进度条同高的文档流区，供 sticky 标题在条可见期间悬挂 */
export function GanttMobileBarTitleTrack({
  barTop,
  barHeight,
  timelineHeight,
  title,
  depth = 0,
  onTitleClick,
}: {
  barTop: number;
  barHeight: number;
  timelineHeight: number;
  title: string;
  depth?: number;
  onTitleClick?: () => void;
}) {
  const tailHeight = Math.max(0, timelineHeight - barTop - barHeight);

  return (
    <div className="pointer-events-none relative z-[25]" style={{ minHeight: timelineHeight }}>
      <div aria-hidden style={{ height: barTop }} />
      <div className="relative" style={{ height: barHeight }}>
        <GanttMobileBarTitle
          title={title}
          depth={depth}
          sticky
          onClick={onTitleClick}
        />
      </div>
      <div aria-hidden style={{ height: tailHeight }} />
    </div>
  );
}
