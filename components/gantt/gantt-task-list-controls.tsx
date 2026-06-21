"use client";

import { useEffect, useRef, useState } from "react";
import { GanttPanelCollapseChevron } from "@/components/gantt/gantt-panel-chevron";
import {
  STATUS_LEGEND,
  STATUS_STYLES,
  type VisualStatusKey,
} from "@/lib/task-status-style";
import { cn } from "@/lib/utils";

export function GanttTaskListControls({
  allExpanded,
  onToggleExpandAll,
  showExpandToggle,
  statusFilter,
  onStatusFilterChange,
  labelVisible = true,
  onToggleLabelPanel,
  drawerTheme = false,
}: {
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  showExpandToggle: boolean;
  statusFilter: Set<VisualStatusKey>;
  onStatusFilterChange: (next: Set<VisualStatusKey>) => void;
  labelVisible?: boolean;
  onToggleLabelPanel?: () => void;
  drawerTheme?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filterActive =
    statusFilter.size > 0 && statusFilter.size < STATUS_LEGEND.length;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function toggleStatus(key: VisualStatusKey) {
    const next = new Set(statusFilter);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onStatusFilterChange(next);
  }

  function selectAll() {
    onStatusFilterChange(new Set(STATUS_LEGEND));
  }

  const compact = drawerTheme;

  return (
    <div className={cn("flex h-full w-full items-center gap-1 px-2", !compact && "border-b border-blue-200/70 py-1.5 dark:border-blue-900/50")}>
      {onToggleLabelPanel && labelVisible && (
        <button
          type="button"
          data-no-pan
          onClick={onToggleLabelPanel}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
            compact ? "h-6 w-6" : "h-7 w-7 text-blue-700 hover:bg-blue-200/50 dark:text-blue-200 dark:hover:bg-blue-900/50",
          )}
          title="收起计划列表"
          aria-label="收起计划列表"
        >
          <GanttPanelCollapseChevron className="text-blue-600 dark:text-blue-300" />
        </button>
      )}

      {showExpandToggle && (
        <button
          type="button"
          data-no-pan
          onClick={onToggleExpandAll}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
            compact ? "h-6 w-6" : "h-7 w-7 text-blue-700/80 hover:bg-blue-200/40 dark:text-blue-200/80 dark:hover:bg-blue-900/40",
          )}
          title={allExpanded ? "隐藏所有子任务" : "展开所有子任务"}
          aria-label={allExpanded ? "隐藏所有子任务" : "展开所有子任务"}
        >
          <span
            className={cn(
              "inline-block text-[11px] transition-transform duration-150",
              allExpanded && "rotate-90",
            )}
          >
            ▶
          </span>
        </button>
      )}

      <div ref={ref} className="relative min-w-0 flex-1">
        <button
          type="button"
          data-no-pan
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between gap-1 rounded-md border text-xs",
            compact ? "h-6 px-1.5 py-0" : "px-2 py-1",
            filterActive
              ? "border-blue-400 bg-blue-100 text-blue-800 dark:border-blue-600 dark:bg-blue-900/50 dark:text-blue-100"
              : drawerTheme
                ? "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
          )}
          aria-label="按状态筛选"
        >
          <span className="truncate">
            状态
            {filterActive && ` (${statusFilter.size})`}
          </span>
          <span className="shrink-0 text-[10px] text-gray-400">▼</span>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {STATUS_LEGEND.map((key) => {
              const style = STATUS_STYLES[key];
              const checked = statusFilter.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  data-no-pan
                  onClick={() => toggleStatus(key)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                >
                  <span
                    className={cn(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-300 bg-white",
                    )}
                  >
                    {checked && <span className="text-[9px] leading-none">✓</span>}
                  </span>
                  <span className={cn("rounded-full", style.dot, "h-2 w-2 shrink-0")} />
                  <span className="text-gray-700">{style.label}</span>
                </button>
              );
            })}
            <div className="mt-1 border-t border-gray-100 px-2 pt-1">
              <button
                type="button"
                data-no-pan
                onClick={selectAll}
                className="w-full rounded px-2 py-1 text-left text-xs text-brand-600 hover:bg-gray-50"
              >
                显示全部
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
