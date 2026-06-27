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
        "pointer-events-auto max-w-[calc(100%+4px)]",
        "rounded-[3px] border border-white bg-white/95 px-[2px] py-1 shadow-sm",
        "dark:border-gray-100 dark:bg-white/90",
        onClick && "cursor-pointer hover:bg-white active:opacity-90",
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
