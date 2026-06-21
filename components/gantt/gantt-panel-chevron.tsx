import { cn } from "@/lib/utils";

/** 双箭头：向右展开计划列表 */
export function GanttPanelExpandChevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={cn("h-4 w-4 text-gray-500 dark:text-gray-400", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4 L9 8 L5 12" />
      <path d="M9 4 L13 8 L9 12" />
    </svg>
  );
}

/** 双箭头：向左收起计划列表 */
export function GanttPanelCollapseChevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={cn("h-4 w-4 text-gray-500 dark:text-gray-400", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4 L7 8 L11 12" />
      <path d="M7 4 L3 8 L7 12" />
    </svg>
  );
}
