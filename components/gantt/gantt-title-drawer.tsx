"use client";

import { Button } from "@/components/ui/button";
import { GanttTaskListControls } from "@/components/gantt/gantt-task-list-controls";
import { GanttPanelCollapseChevron, GanttPanelExpandChevron } from "@/components/gantt/gantt-panel-chevron";
import {
  GANTT_DRAWER_TOGGLE_WIDTH,
  GANTT_STICKY_HEADER_CLASS,
  GANTT_TITLE_DRAWER_CLASS,
} from "@/lib/gantt-title-column";
import type { VisualStatusKey } from "@/lib/task-status-style";
import { cn } from "@/lib/utils";

export function GanttDrawerOpenTab({
  headerHeight,
  onOpen,
}: {
  headerHeight: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-no-pan
      className={cn(
        "absolute left-0 top-0 z-50 flex items-center justify-center",
        "rounded-r-md border border-l-0 border-blue-200 bg-blue-50 shadow-md",
        "hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/80 dark:hover:bg-blue-900/60",
      )}
      style={{ width: GANTT_DRAWER_TOGGLE_WIDTH, height: headerHeight }}
      title="显示计划列表"
      aria-label="显示计划列表"
      onClick={onOpen}
    >
      <GanttPanelExpandChevron className="text-blue-600 dark:text-blue-300" />
    </button>
  );
}

export function GanttTitleDrawer({
  width,
  headerHeight,
  bodyHeight,
  footerHeight,
  isResizing,
  header,
  body,
  footer,
  onResizeStart,
}: {
  width: number;
  headerHeight: number;
  bodyHeight: number;
  footerHeight: number;
  isResizing: boolean;
  header: React.ReactNode;
  body: React.ReactNode;
  footer: React.ReactNode;
  onResizeStart: (clientX: number) => void;
}) {
  return (
    <div
      className={cn("relative sticky left-0 z-30 flex shrink-0 flex-col", GANTT_TITLE_DRAWER_CLASS)}
      style={{ width }}
    >
      <div
        className={cn(GANTT_STICKY_HEADER_CLASS, "items-center")}
        style={{ height: headerHeight, minHeight: headerHeight }}
      >
        {header}
      </div>
      <div style={{ minHeight: bodyHeight }}>{body}</div>
      <div className="flex shrink-0 items-center px-2" style={{ height: footerHeight }}>
        {footer}
      </div>
      <div
        data-no-pan
        role="separator"
        aria-orientation="vertical"
        aria-label="调整计划列表宽度"
        className={cn(
          "absolute right-0 top-0 z-10 h-full w-2 -translate-x-1/2 cursor-col-resize touch-none select-none",
          "hover:bg-blue-400/20",
          isResizing && "bg-blue-500/25",
        )}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onResizeStart(e.clientX);
        }}
      />
    </div>
  );
}

export function GanttTitleDrawerControls({
  allExpanded,
  onToggleExpandAll,
  showExpandToggle,
  statusFilter,
  onStatusFilterChange,
  onCloseDrawer,
}: {
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  showExpandToggle: boolean;
  statusFilter: Set<VisualStatusKey>;
  onStatusFilterChange: (next: Set<VisualStatusKey>) => void;
  onCloseDrawer: () => void;
}) {
  return (
    <GanttTaskListControls
      allExpanded={allExpanded}
      onToggleExpandAll={onToggleExpandAll}
      showExpandToggle={showExpandToggle}
      statusFilter={statusFilter}
      onStatusFilterChange={onStatusFilterChange}
      labelVisible
      onToggleLabelPanel={onCloseDrawer}
      drawerTheme
    />
  );
}

export function GanttTitleDrawerFooter({ onCreatePlan }: { onCreatePlan: () => void }) {
  return (
    <Button
      size="sm"
      variant="secondary"
      type="button"
      data-no-pan
      className="w-full border-blue-200 bg-white/90 text-blue-900 hover:bg-white dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-100"
      onClick={onCreatePlan}
    >
      + 新建
    </Button>
  );
}
