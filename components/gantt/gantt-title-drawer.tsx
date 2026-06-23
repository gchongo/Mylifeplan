"use client";

import { GanttTaskListControls } from "@/components/gantt/gantt-task-list-controls";
import { GanttPanelExpandChevron } from "@/components/gantt/gantt-panel-chevron";
import type { GanttScheduleColumnId } from "@/lib/gantt-schedule-columns";
import {
  GANTT_DRAWER_TOGGLE_WIDTH,
  GANTT_STICKY_HEADER_CLASS,
  GANTT_TITLE_DRAWER_CLASS,
} from "@/lib/gantt-title-column";
import type { VisualStatusKey } from "@/lib/task-status-style";
import { cn } from "@/lib/utils";

export function GanttDrawerOpenTab({
  headerHeight,
  visible,
  onOpen,
}: {
  headerHeight: number;
  visible: boolean;
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
        "transition-[opacity,transform] duration-300 ease-in-out",
        visible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none -translate-x-full opacity-0",
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

export function GanttTitleDrawerBody({
  width,
  bodyHeight,
  body,
}: {
  width: number;
  bodyHeight: number;
  body: React.ReactNode;
}) {
  return (
    <div
      className={cn("relative flex shrink-0 flex-col", GANTT_TITLE_DRAWER_CLASS)}
      style={{ width }}
    >
      <div style={{ minHeight: bodyHeight }}>{body}</div>
    </div>
  );
}

/** @deprecated 使用固定顶栏 + GanttTitleDrawerBody */
export function GanttTitleDrawer({
  width,
  bodyHeight,
  body,
}: {
  width: number;
  headerHeight?: number;
  bodyHeight: number;
  isResizing?: boolean;
  header?: React.ReactNode;
  body: React.ReactNode;
  onResizeStart?: (clientX: number) => void;
}) {
  return <GanttTitleDrawerBody width={width} bodyHeight={bodyHeight} body={body} />;
}

export function GanttTitleDrawerControls({
  allExpanded,
  onToggleExpandAll,
  showExpandToggle,
  statusFilter,
  onStatusFilterChange,
  onCloseDrawer,
  onCreatePlan,
  showActualTimeline,
  onToggleActualTimeline,
  scheduleColumns,
  onScheduleColumnsChange,
}: {
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  showExpandToggle: boolean;
  statusFilter: Set<VisualStatusKey>;
  onStatusFilterChange: (next: Set<VisualStatusKey>) => void;
  onCloseDrawer: () => void;
  onCreatePlan: () => void;
  showActualTimeline?: boolean;
  onToggleActualTimeline?: () => void;
  scheduleColumns?: GanttScheduleColumnId[];
  onScheduleColumnsChange?: (next: GanttScheduleColumnId[]) => void;
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
      onCreatePlan={onCreatePlan}
      showActualTimeline={showActualTimeline}
      onToggleActualTimeline={onToggleActualTimeline}
      scheduleColumns={scheduleColumns}
      onScheduleColumnsChange={onScheduleColumnsChange}
      drawerTheme
    />
  );
}
