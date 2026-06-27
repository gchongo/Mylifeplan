"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  STATUS_LEGEND,
  STATUS_STYLES,
  type VisualStatusKey,
} from "@/lib/task-status-style";
import { localizeVisualStatusLabel } from "@/lib/i18n/gantt-helpers";
import { cn } from "@/lib/utils";

/** 移动端工具栏：红黄绿三灯，仅作状态筛选入口图标 */
const TRAFFIC_LIGHT_DOTS = [
  "bg-red-500",
  "bg-yellow-400",
  "bg-emerald-500",
] as const;

/** 与 GanttLayerToggleButton 一致的外框尺寸，保证与「实际」按钮等高对齐 */
const TRAFFIC_LIGHT_TRIGGER_CLASS =
  "inline-flex shrink-0 items-center justify-center gap-1 rounded-full border px-2 py-1 text-sm font-medium leading-none transition-colors";

function StatusFilterDropdown({
  open,
  statusFilter,
  onStatusFilterChange,
  onSelectAll,
  t,
}: {
  open: boolean;
  statusFilter: Set<VisualStatusKey>;
  onStatusFilterChange: (next: Set<VisualStatusKey>) => void;
  onSelectAll: () => void;
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
      <div className="mt-1 border-t border-gray-100 px-2 pt-1 dark:border-gray-800">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectAll();
          }}
          className="w-full rounded px-2 py-1 text-left text-xs text-brand-600 hover:bg-gray-50 dark:text-brand-400 dark:hover:bg-gray-800"
        >
          {t("gantt.taskList.showAll")}
        </button>
      </div>
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

  function selectAll() {
    onStatusFilterChange(new Set(STATUS_LEGEND));
  }

  const triggerClass =
    variant === "traffic-light"
      ? cn(
          TRAFFIC_LIGHT_TRIGGER_CLASS,
          filterActive
            ? "border-brand-300 bg-brand-50 hover:bg-brand-100/80 dark:border-brand-700 dark:bg-brand-950/50 dark:hover:bg-brand-950/70"
            : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800",
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
        onSelectAll={selectAll}
        t={t}
      />
    </div>
  );
}
