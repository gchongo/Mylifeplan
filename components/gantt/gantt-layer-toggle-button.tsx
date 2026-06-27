"use client";

import { cn } from "@/lib/utils";

/** 工具栏切换按钮统一外框：固定 h-8，贡献/实际/状态灯共用 */
export const GANTT_TOOLBAR_TOGGLE_SHELL =
  "box-border inline-flex h-8 shrink-0 items-center justify-center border px-2.5 text-sm font-medium leading-none transition-colors";

export const ganttToolbarToggleActiveClass =
  "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-950/50 dark:text-brand-200";

export const ganttToolbarToggleInactiveClass =
  "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800";

export function GanttLayerToggleButton({
  label,
  active,
  onToggle,
  title,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        GANTT_TOOLBAR_TOGGLE_SHELL,
        "rounded-lg",
        active ? ganttToolbarToggleActiveClass : ganttToolbarToggleInactiveClass,
      )}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
