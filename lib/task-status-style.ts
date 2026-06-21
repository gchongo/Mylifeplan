import type { TaskStatus } from "@/types";

/** 全局任务/计划状态视觉语义（颜色优先，文字仅作辅助说明） */
export type VisualStatusKey = "todo" | "in_progress" | "done" | "archived" | "overdue" | "unscheduled";

export interface StatusStyle {
  key: VisualStatusKey;
  label: string;
  /** 列表/详情中的小圆点 */
  dot: string;
  /** @deprecated 实心条，甘特图请用 getGanttBarStyle */
  bar: string;
  /** 浅色行背景（可选） */
  rowBg: string;
  /** 左侧强调条 */
  stripe: string;
}

/** 甘特条：描边 + 文字色，区分父/子任务 */
export interface GanttBarStyle {
  shell: string;
  text: string;
}

const GANTT_BAR_STYLES: Record<
  VisualStatusKey,
  { parent: GanttBarStyle; child: GanttBarStyle }
> = {
  todo: {
    parent: {
      shell: "border-2 border-solid border-amber-500 bg-white/95 dark:border-amber-400 dark:bg-gray-900/90",
      text: "text-amber-700 dark:text-amber-300 font-semibold",
    },
    child: {
      shell: "border-2 border-dashed border-amber-400 bg-amber-50/60 dark:border-amber-500/70 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
    },
  },
  in_progress: {
    parent: {
      shell: "border-2 border-solid border-blue-600 bg-white/95 dark:border-blue-400 dark:bg-gray-900/90",
      text: "text-blue-700 dark:text-blue-300 font-semibold",
    },
    child: {
      shell: "border-2 border-dashed border-blue-500 bg-blue-50/60 dark:border-blue-500/70 dark:bg-blue-950/40",
      text: "text-blue-700 dark:text-blue-300",
    },
  },
  done: {
    parent: {
      shell: "border-2 border-solid border-emerald-600 bg-white/95 dark:border-emerald-400 dark:bg-gray-900/90",
      text: "text-emerald-700 dark:text-emerald-300 font-semibold",
    },
    child: {
      shell: "border-2 border-dashed border-emerald-500 bg-emerald-50/60 dark:border-emerald-500/70 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
    },
  },
  archived: {
    parent: {
      shell: "border-2 border-solid border-gray-400 bg-white/95 dark:border-gray-500 dark:bg-gray-900/90",
      text: "text-gray-600 dark:text-gray-300 font-semibold",
    },
    child: {
      shell: "border-2 border-dashed border-gray-400 bg-gray-50/80 dark:border-gray-600 dark:bg-gray-800/60",
      text: "text-gray-600 dark:text-gray-400",
    },
  },
  overdue: {
    parent: {
      shell: "border-2 border-solid border-red-600 bg-white/95 dark:border-red-400 dark:bg-gray-900/90",
      text: "text-red-700 dark:text-red-300 font-semibold",
    },
    child: {
      shell: "border-2 border-dashed border-red-500 bg-red-50/60 dark:border-red-500/70 dark:bg-red-950/40",
      text: "text-red-700 dark:text-red-300",
    },
  },
  unscheduled: {
    parent: {
      shell: "border-2 border-dashed border-violet-400 bg-violet-50/50 dark:border-violet-500/60 dark:bg-violet-950/30",
      text: "text-violet-700 dark:text-violet-300",
    },
    child: {
      shell: "border-2 border-dashed border-violet-400 bg-violet-50/50 dark:border-violet-500/60 dark:bg-violet-950/30",
      text: "text-violet-700 dark:text-violet-300",
    },
  },
};

export const STATUS_STYLES: Record<VisualStatusKey, StatusStyle> = {
  todo: {
    key: "todo",
    label: "待办",
    dot: "bg-amber-400 ring-amber-300",
    bar: "bg-amber-500 shadow-sm ring-1 ring-amber-600/30",
    rowBg: "bg-white dark:bg-gray-900",
    stripe: "border-l-amber-400",
  },
  in_progress: {
    key: "in_progress",
    label: "进行中",
    dot: "bg-blue-500 ring-blue-300",
    bar: "bg-blue-600 shadow-sm ring-1 ring-blue-700/30",
    rowBg: "bg-white dark:bg-gray-900",
    stripe: "border-l-blue-500",
  },
  done: {
    key: "done",
    label: "已完成",
    dot: "bg-emerald-500 ring-emerald-300",
    bar: "bg-emerald-600 shadow-sm ring-1 ring-emerald-700/30",
    rowBg: "bg-white dark:bg-gray-900",
    stripe: "border-l-emerald-500",
  },
  archived: {
    key: "archived",
    label: "已归档",
    dot: "bg-gray-400 ring-gray-300",
    bar: "bg-gray-500 shadow-sm ring-1 ring-gray-600/30",
    rowBg: "bg-white dark:bg-gray-900",
    stripe: "border-l-gray-400",
  },
  overdue: {
    key: "overdue",
    label: "超期",
    dot: "bg-red-500 ring-red-300",
    bar: "bg-red-600 shadow-sm ring-1 ring-red-700/30",
    rowBg: "bg-white dark:bg-gray-900",
    stripe: "border-l-red-500",
  },
  unscheduled: {
    key: "unscheduled",
    label: "未排期",
    dot: "bg-violet-400 ring-violet-300",
    bar: "bg-violet-400 shadow-sm ring-1 ring-violet-500/30",
    rowBg: "bg-white dark:bg-gray-900",
    stripe: "border-l-violet-400",
  },
};

/** 图例顺序（甘特图/任务页共用） */
export const STATUS_LEGEND: VisualStatusKey[] = [
  "todo",
  "in_progress",
  "done",
  "unscheduled",
  "overdue",
  "archived",
];

const PLAN_TO_TASK: Record<string, VisualStatusKey> = {
  not_started: "todo",
  in_progress: "in_progress",
  done: "done",
  archived: "archived",
};

import { todayStr } from "@/lib/dates";

export function todayDateOnly(): string {
  return todayStr();
}

export function normalizeStatusKey(status: string | undefined | null): VisualStatusKey {
  if (!status) return "todo";
  if (status in STATUS_STYLES) return status as VisualStatusKey;
  if (status in PLAN_TO_TASK) return PLAN_TO_TASK[status]!;
  return "todo";
}

export function isOverdue(
  dueDate: string | null | undefined,
  status: string | undefined | null,
): boolean {
  if (!dueDate || !status) return false;
  const base = normalizeStatusKey(status);
  if (base === "done" || base === "archived") return false;
  const due = dueDate.length >= 10 ? dueDate.slice(0, 10) : dueDate;
  return due < todayDateOnly();
}

/** 解析最终用于上色的状态（汇总状态 + 超期优先） */
export function resolveVisualStatus(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
): VisualStatusKey {
  const effective = displayStatus ?? status ?? "todo";
  if (isOverdue(dueDate, effective)) return "overdue";
  return normalizeStatusKey(effective);
}

export function getStatusStyle(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
): StatusStyle {
  return STATUS_STYLES[resolveVisualStatus(status, dueDate, displayStatus)];
}

export function getGanttBarStyle(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
  depth = 0,
): GanttBarStyle {
  const visual = resolveVisualStatus(status, dueDate, displayStatus);
  return GANTT_BAR_STYLES[visual][depth > 0 ? "child" : "parent"];
}

export function statusBarClass(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
  depth = 0,
): string {
  const { shell, text } = getGanttBarStyle(status, dueDate, displayStatus, depth);
  return `${shell} ${text}`;
}

export function statusLabel(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
  hasRollup?: boolean,
): string {
  const style = getStatusStyle(status, dueDate, displayStatus);
  return hasRollup ? `${style.label}（汇总）` : style.label;
}

export function asTaskStatusForRollup(status: string | undefined | null): TaskStatus {
  const key = normalizeStatusKey(status);
  if (key === "overdue") return "todo";
  return key as TaskStatus;
}
