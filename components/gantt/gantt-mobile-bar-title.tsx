"use client";

import { getMobilePlanBarLabelStyle } from "@/lib/plan-color";
import { cn } from "@/lib/utils";

/** 吸顶时标题离屏幕顶边的距离 */
export const MOBILE_BAR_TITLE_STICKY_TOP = 12;

/** 标题起点：胶囊顶圆角半径 ≈ 条宽/2，再加描边与留白 */
export function mobileBarTitleTopPadPx(barWidthPx: number): number {
  return Math.ceil(barWidthPx / 2) + 12;
}

/** 竖排标题：仅展示，不拦截点击（点击由计划条处理） */
export function GanttMobileBarTitle({
  title,
  depth = 0,
  planColor,
  barWidthPx,
  sticky = false,
  maxHeight,
  className,
}: {
  title: string;
  depth?: number;
  planColor: string;
  barWidthPx: number;
  sticky?: boolean;
  maxHeight?: number;
  className?: string;
}) {
  const labelStyle = getMobilePlanBarLabelStyle(planColor);

  return (
    <span
      className={cn(
        "pointer-events-none box-border w-full max-w-full bg-transparent px-0 py-0",
        sticky ? "sticky z-[22] grid justify-items-center" : "absolute left-0 right-0 z-[22] grid justify-items-center",
        className,
      )}
      style={{
        ...labelStyle,
        width: barWidthPx,
        maxWidth: barWidthPx,
        ...(sticky ? { top: MOBILE_BAR_TITLE_STICKY_TOP } : undefined),
      }}
      title={title}
    >
      <span
        className={cn(
          "block w-max max-w-full overflow-hidden whitespace-nowrap text-center",
          "leading-[1.25] tracking-tight",
          "[writing-mode:vertical-lr] [text-orientation:upright]",
          depth === 0 ? "text-[13px] font-bold" : "text-[12px] font-semibold",
        )}
        style={maxHeight != null ? { maxHeight } : undefined}
      >
        {title}
      </span>
    </span>
  );
}

/** 与计划条同宽同位的文档流区，供 sticky 标题在条可见期间悬挂 */
export function GanttMobileBarTitleTrack({
  barTop,
  barHeight,
  barWidthPx,
  timelineHeight,
  title,
  depth = 0,
  planColor,
}: {
  barTop: number;
  barHeight: number;
  barWidthPx: number;
  timelineHeight: number;
  title: string;
  depth?: number;
  planColor: string;
}) {
  const tailHeight = Math.max(0, timelineHeight - barTop - barHeight);
  const topPadPx = mobileBarTitleTopPadPx(barWidthPx);
  const titleMaxHeight = Math.max(0, barHeight - topPadPx);

  return (
    <div
      className="pointer-events-none relative z-[22] h-full w-full overflow-visible"
      style={{ minHeight: timelineHeight }}
    >
      <div aria-hidden style={{ height: barTop }} />
      <div className="relative overflow-visible" style={{ height: barHeight, width: barWidthPx }}>
        <div aria-hidden className="w-full shrink-0" style={{ height: topPadPx }} />
        <div
          className="relative box-border overflow-visible"
          style={{ height: Math.max(0, barHeight - topPadPx), width: barWidthPx }}
        >
          <GanttMobileBarTitle
            title={title}
            depth={depth}
            planColor={planColor}
            barWidthPx={barWidthPx}
            sticky
            maxHeight={titleMaxHeight}
          />
        </div>
      </div>
      <div aria-hidden style={{ height: tailHeight }} />
    </div>
  );
}
