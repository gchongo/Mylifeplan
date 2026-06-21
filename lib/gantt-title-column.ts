/** 甘特图左侧计划标题抽屉 */
export const GANTT_TITLE_DRAWER_CLASS =
  "flex flex-col border-r border-blue-200 bg-blue-50 shadow-[2px_0_8px_rgba(37,99,235,0.08)] dark:border-blue-900/70 dark:bg-blue-950/55 dark:shadow-[2px_0_12px_rgba(0,0,0,0.35)]";

export const GANTT_TITLE_DRAWER_HEADER_CLASS =
  "shrink-0 border-b border-blue-200/80 bg-blue-100/70 dark:border-blue-900/50 dark:bg-blue-900/35";

export const GANTT_TITLE_ROW_CLASS =
  "border-b border-blue-100/90 dark:border-blue-900/45";

/** 抽屉收起后，时间轴左侧展开按钮宽度 */
export const GANTT_DRAWER_TOGGLE_WIDTH = 28;

/** @deprecated 使用 GANTT_TITLE_DRAWER_CLASS */
export const GANTT_TITLE_COLUMN_CLASS = GANTT_TITLE_DRAWER_CLASS;

/** @deprecated */
export const GANTT_TITLE_COLUMN_HEADER_CLASS = GANTT_TITLE_DRAWER_HEADER_CLASS;

/** @deprecated 使用 GANTT_DRAWER_TOGGLE_WIDTH */
export const GANTT_COLLAPSED_RAIL_WIDTH = GANTT_DRAWER_TOGGLE_WIDTH;
