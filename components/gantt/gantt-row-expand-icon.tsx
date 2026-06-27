"use client";

/** 甘特行展开：▶ 已展开，▼ 已收起（与 PC 一致，固定盒保证尺寸统一） */
export function GanttRowExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <span
      className="inline-flex h-3 w-3 shrink-0 items-center justify-center text-[10px] leading-none"
      aria-hidden
    >
      {expanded ? "▶" : "▼"}
    </span>
  );
}
