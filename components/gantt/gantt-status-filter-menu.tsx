"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  STATUS_LEGEND,
  STATUS_STYLES,
  type VisualStatusKey,
} from "@/lib/task-status-style";
import { localizeVisualStatusLabel } from "@/lib/i18n/gantt-helpers";
import {
  GANTT_TOOLBAR_TOGGLE_SHELL,
  ganttToolbarToggleActiveClass,
  ganttToolbarToggleInactiveClass,
} from "@/components/gantt/gantt-layer-toggle-button";
import { cn } from "@/lib/utils";

/** 移动端工具栏：红黄绿三灯，仅作状态筛选入口图标 */
const TRAFFIC_LIGHT_DOTS = [
  "bg-red-500",
  "bg-yellow-400",
  "bg-emerald-500",
] as const;

function StatusFilterDropdown({
  open,
  statusFilter,
  onStatusFilterChange,
  t,
}: {
  open: boolean;
  statusFilter: Set<VisualStatusKey>;
  onStatusFilterChange: (next: Set<VisualStatusKey>) => void;
  t: ReturnType<typeof useI18n>["t"];
}) {
  if (!open) return null;

  function toggleStatus(key: VisualStatusKey) {
    const next = new Set(statusFilter);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onStatusFilterChange(next);
  }

  return (
    <div className="absolute left-0 top-full z-[100] mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {STATUS_LEGEND.map((key) => {
        const style = STATUS_STYLES[key];
        const checked = statusFilter.has(key);
        return (
          <button
            key={key}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleStatus(key);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span
              className={cn(
                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                checked
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900",
              )}
            >
              {checked && <span className="text-[9px] leading-none">✓</span>}
            </span>
            <span className={cn("rounded-full", style.dot, "h-2 w-2 shrink-0")} />
            <span className="text-gray-700 dark:text-gray-200">
              {localizeVisualStatusLabel(t, key)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function GanttStatusFilterMenu({
  statusFilter,
  onStatusFilterChange,
  className,
  buttonClassName,
  variant = "menu",
}: {
  statusFilter: Set<VisualStatusKey>;
  onStatusFilterChange: (next: Set<VisualStatusKey>) => void;
  className?: string;
  buttonClassName?: string;
  variant?: "menu" | "traffic-light";
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filterActive =
    statusFilter.size > 0 && statusFilter.size < STATUS_LEGEND.length;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  const triggerClass =
    variant === "traffic-light"
      ? cn(
          GANTT_TOOLBAR_TOGGLE_SHELL,
          "gap-1 rounded-full px-2",
          filterActive ? ganttToolbarToggleActiveClass : ganttToolbarToggleInactiveClass,
          buttonClassName,
        )
      : cn(
          "flex items-center justify-between gap-1 rounded-lg border px-2.5 py-1 text-sm",
          filterActive
            ? "border-blue-400 bg-blue-100 text-blue-800 dark:border-blue-600 dark:bg-blue-900/50 dark:text-blue-100"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",
          buttonClassName,
        );

  return (
    <div ref={ref} className={cn("relative z-50", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={triggerClass}
        aria-label={t("gantt.taskList.statusFilter")}
        aria-expanded={open}
      >
        {variant === "traffic-light" ? (
          TRAFFIC_LIGHT_DOTS.map((color, index) => (
            <span
              key={index}
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                color,
                filterActive ? "opacity-70" : "opacity-100",
              )}
              aria-hidden
            />
          ))
        ) : (
          <>
            <span className="truncate whitespace-nowrap">
              {t("gantt.taskList.status")}
              {filterActive && ` (${statusFilter.size})`}
            </span>
            <span className="shrink-0 text-[10px] text-gray-400">▼</span>
          </>
        )}
      </button>

      <StatusFilterDropdown
        open={open}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        t={t}
      />
    </div>
  );
}
