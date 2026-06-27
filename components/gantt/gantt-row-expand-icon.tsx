"use client";

/** 甘特行展开：▶ 已展开，▼ 已收起；SVG 保证两种状态尺寸一致 */
export function GanttRowExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3 w-3 shrink-0"
      aria-hidden
    >
      {expanded ? (
        <path
          d="M4.2 2.2 L8.8 6 L4.2 9.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M2.2 4.2 L6 8.8 L9.8 4.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
