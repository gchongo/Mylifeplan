"use client";

import { getMobilePlanBarLabelStyle } from "@/lib/plan-color";
import { MOBILE_TITLE_LANE_WIDTH } from "@/lib/gantt-mobile-layout";
import { cn } from "@/lib/utils";

/** 移动端甘特条标题：竖排、与计划色同系；sticky 时悬挂在可视区顶缘 */
export function GanttMobileBarTitle({
  title,
  depth = 0,
  planColor,
  onClick,
  sticky = false,
  className,
}: {
  title: string;
  depth?: number;
  planColor: string;
  onClick?: () => void;
  sticky?: boolean;
  className?: string;
}) {
  const Tag = onClick ? "button" : "span";
  const labelStyle = getMobilePlanBarLabelStyle(planColor);

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={cn(
        "pointer-events-auto bg-transparent px-0 py-0",
        "border-0 shadow-none",
        onClick && "cursor-pointer active:opacity-80",
        sticky ? "sticky top-0 z-30 block w-full" : "absolute left-0 top-1 z-20",
        className,
      )}
      style={{ width: sticky ? MOBILE_TITLE_LANE_WIDTH : undefined, ...labelStyle }}
      onClick={onClick}
      onPointerDown={onClick ? (e) => e.stopPropagation() : undefined}
      title={title}
    >
      <span
        className={cn(
          "block max-h-[7rem] overflow-hidden whitespace-nowrap text-left",
          "leading-[1.25] tracking-tight",
          "[writing-mode:vertical-rl] [text-orientation:upright]",
          depth === 0 ? "text-[13px] font-bold" : "text-[12px] font-semibold",
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
  planColor,
  onTitleClick,
}: {
  barTop: number;
  barHeight: number;
  timelineHeight: number;
  title: string;
  depth?: number;
  planColor: string;
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
          planColor={planColor}
          sticky
          onClick={onTitleClick}
        />
      </div>
      <div aria-hidden style={{ height: tailHeight }} />
    </div>
  );
}
