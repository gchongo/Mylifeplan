"use client";

import { GanttPanelCollapseChevron } from "@/components/gantt/gantt-panel-chevron";
import { GanttStatusFilterMenu } from "@/components/gantt/gantt-status-filter-menu";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { VisualStatusKey } from "@/lib/task-status-style";
import { cn } from "@/lib/utils";

export function GanttTaskListControls({
  allExpanded,
  onToggleExpandAll,
  showExpandToggle,
  statusFilter,
  onStatusFilterChange,
  onToggleTitlePanel,
  onCreatePlan,
  drawerTheme = false,
}: {
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  showExpandToggle: boolean;
  statusFilter: Set<VisualStatusKey>;
  onStatusFilterChange: (next: Set<VisualStatusKey>) => void;
  onToggleTitlePanel?: () => void;
  onCreatePlan?: () => void;
  drawerTheme?: boolean;
}) {
  const { t } = useI18n();
  const compact = drawerTheme;

  return (
    <div className={cn("flex h-full w-full items-center gap-1 px-2", !compact && "border-b border-blue-200/70 py-1.5 dark:border-blue-900/50")}>
      {onToggleTitlePanel && (
        <button
          type="button"
          data-no-pan
          onClick={onToggleTitlePanel}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
            compact ? "h-6 w-6" : "h-7 w-7 text-blue-700 hover:bg-blue-200/50 dark:text-blue-200 dark:hover:bg-blue-900/50",
          )}
          title={t("gantt.taskList.collapsePlanList")}
          aria-label={t("gantt.taskList.collapsePlanList")}
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
          title={allExpanded ? t("gantt.taskList.collapseAll") : t("gantt.taskList.expandAll")}
          aria-label={allExpanded ? t("gantt.taskList.collapseAll") : t("gantt.taskList.expandAll")}
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

      <GanttStatusFilterMenu
        variant="traffic-light"
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        className="flex shrink-0 items-center"
        buttonClassName={compact ? "h-6 rounded-full px-1.5" : "h-7 rounded-full px-2"}
      />

      {onCreatePlan && (
        <button
          type="button"
          data-no-pan
          onClick={onCreatePlan}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md border text-xs font-medium",
            compact
              ? "h-6 min-w-6 px-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              : "h-7 px-2 text-blue-800 hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50",
            drawerTheme
              ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
              : "border-blue-200 bg-white/90 dark:border-blue-800 dark:bg-blue-900/40",
          )}
          title={t("gantt.newPlanOrContribution")}
          aria-label={t("gantt.newPlanOrContribution")}
        >
          +
        </button>
      )}
    </div>
  );
}
