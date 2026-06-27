"use client";

import { getMobilePlanBarLabelStyle } from "@/lib/plan-color";
import { cn } from "@/lib/utils";

/** 吸顶时标题离屏幕顶边的距离 */
export const MOBILE_BAR_TITLE_STICKY_TOP = 12;

/** 标题起点：胶囊顶圆角半径 ≈ 条宽/2，再加描边与留白 */
export function mobileBarTitleTopPadPx(barWidthPx: number): number {
  return Math.ceil(barWidthPx / 2) + 12;
}

function MobileBarTitleLabel({
  title,
  depth,
  planColor,
  onClick,
}: {
  title: string;
  depth: number;
  planColor: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "span";
  const labelStyle = getMobilePlanBarLabelStyle(planColor);

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={cn(
        "pointer-events-auto absolute left-1/2 top-0 max-w-none -translate-x-1/2 origin-center rotate-90",
        "whitespace-nowrap border-0 bg-transparent px-0 py-0 shadow-none",
        "leading-none tracking-tight",
        depth === 0 ? "text-[13px] font-bold" : "text-[12px] font-semibold",
        onClick && "cursor-pointer active:opacity-80",
      )}
      style={labelStyle}
      onClick={onClick}
      onPointerDown={onClick ? (e) => e.stopPropagation() : undefined}
      title={title}
    >
      {title}
    </Tag>
  );
}

/** 计划条胶囊内居中标题；sticky 在条内，滚出视口时吸顶 */
export function GanttMobileBarTitleInBar({
  title,
  depth = 0,
  planColor,
  barWidthPx,
  barHeight,
  onTitleClick,
}: {
  title: string;
  depth?: number;
  planColor: string;
  barWidthPx: number;
  barHeight: number;
  onTitleClick?: () => void;
}) {
  const topPadPx = mobileBarTitleTopPadPx(barWidthPx);
  const bottomPadPx = 16;
  const titleMaxHeight = Math.max(0, barHeight - topPadPx - bottomPadPx);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-[8] overflow-visible"
      style={{ top: topPadPx, bottom: bottomPadPx }}
    >
      <div
        className="sticky relative w-full overflow-visible"
        style={{ top: MOBILE_BAR_TITLE_STICKY_TOP, height: titleMaxHeight, width: barWidthPx }}
      >
        <MobileBarTitleLabel
          title={title}
          depth={depth}
          planColor={planColor}
          onClick={onTitleClick}
        />
      </div>
    </div>
  );
}
