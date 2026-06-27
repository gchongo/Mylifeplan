"use client";

import { getMobilePlanBarLabelStyle } from "@/lib/plan-color";
import { cn } from "@/lib/utils";

/** 标题与计划条顶部的内边距 */
export const MOBILE_BAR_TITLE_TOP_PAD = 8;

/** 移动端甘特条标题：竖排、居中叠在计划条上；sticky 时悬挂在可视区顶缘 */
export function GanttMobileBarTitle({
  title,
  depth = 0,
  planColor,
  onClick,
  sticky = false,
  maxHeight,
  className,
}: {
  title: string;
  depth?: number;
  planColor: string;
  onClick?: () => void;
  sticky?: boolean;
  maxHeight?: number;
  className?: string;
}) {
  const Tag = onClick ? "button" : "span";
  const labelStyle = getMobilePlanBarLabelStyle(planColor);
  const titleMaxHeight =
    maxHeight != null ? Math.max(0, maxHeight - MOBILE_BAR_TITLE_TOP_PAD) : undefined;

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={cn(
        "pointer-events-auto bg-transparent px-0 py-0",
        "border-0 shadow-none",
        onClick && "cursor-pointer active:opacity-80",
        sticky
          ? "sticky z-30 mx-auto block w-fit"
          : "absolute left-1/2 z-20 -translate-x-1/2",
        className,
      )}
      style={{
        ...labelStyle,
        ...(sticky ? { top: MOBILE_BAR_TITLE_TOP_PAD } : { top: MOBILE_BAR_TITLE_TOP_PAD }),
      }}
      onClick={onClick}
      onPointerDown={onClick ? (e) => e.stopPropagation() : undefined}
      title={title}
    >
      <span
        className={cn(
          "block overflow-hidden whitespace-nowrap text-center",
          "leading-[1.25] tracking-tight",
          "[writing-mode:vertical-lr] [text-orientation:upright]",
          depth === 0 ? "text-[13px] font-bold" : "text-[12px] font-semibold",
        )}
        style={titleMaxHeight != null ? { maxHeight: titleMaxHeight } : undefined}
      >
        {title}
      </span>
    </Tag>
  );
}

/** 与进度条同高的文档流区，供 sticky 标题在条可见期间悬挂（水平与条对齐） */
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
      <div
        className="relative flex items-start justify-center overflow-visible"
        style={{ height: barHeight }}
      >
        <GanttMobileBarTitle
          title={title}
          depth={depth}
          planColor={planColor}
          sticky
          maxHeight={barHeight}
          onClick={onTitleClick}
        />
      </div>
      <div aria-hidden style={{ height: tailHeight }} />
    </div>
  );
}
