"use client";

import { getMobilePlanBarLabelStyle } from "@/lib/plan-color";
import { cn } from "@/lib/utils";

/** 标题起点：胶囊顶圆角半径 ≈ 条宽/2，再加描边与留白 */
export function mobileBarTitleTopPadPx(barWidthPx: number): number {
  return Math.ceil(barWidthPx / 2) + 12;
}

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

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={cn(
        "pointer-events-auto bg-transparent px-0 py-0",
        "border-0 shadow-none",
        onClick && "cursor-pointer active:opacity-80",
        sticky
          ? "sticky top-0 z-[22] mx-auto block w-fit"
          : "absolute left-1/2 z-[22] -translate-x-1/2",
        className,
      )}
      style={labelStyle}
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
        style={maxHeight != null ? { maxHeight } : undefined}
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
  barWidthPx,
  timelineHeight,
  title,
  depth = 0,
  planColor,
  onTitleClick,
}: {
  barTop: number;
  barHeight: number;
  barWidthPx: number;
  timelineHeight: number;
  title: string;
  depth?: number;
  planColor: string;
  onTitleClick?: () => void;
}) {
  const tailHeight = Math.max(0, timelineHeight - barTop - barHeight);
  const topPadPx = mobileBarTitleTopPadPx(barWidthPx);
  const titleMaxHeight = Math.max(0, barHeight - topPadPx);

  return (
    <div className="pointer-events-none relative z-[22]" style={{ minHeight: timelineHeight }}>
      <div aria-hidden style={{ height: barTop }} />
      <div
        className="relative flex flex-col items-center overflow-visible"
        style={{ height: barHeight }}
      >
        <div aria-hidden className="w-full shrink-0" style={{ height: topPadPx }} />
        <GanttMobileBarTitle
          title={title}
          depth={depth}
          planColor={planColor}
          sticky
          maxHeight={titleMaxHeight}
          onClick={onTitleClick}
        />
      </div>
      <div aria-hidden style={{ height: tailHeight }} />
    </div>
  );
}
