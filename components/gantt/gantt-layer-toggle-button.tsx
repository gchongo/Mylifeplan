"use client";

import { cn } from "@/lib/utils";

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
        "rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors",
        active
          ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-950/50 dark:text-brand-200"
          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800",
      )}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
