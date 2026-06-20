import type { TaskStatus } from "@/types";

/** 全局任务/计划状态视觉语义（颜色优先，文字仅作辅助说明） */
export type VisualStatusKey = "todo" | "in_progress" | "done" | "archived" | "overdue";

export interface StatusStyle {
  key: VisualStatusKey;
  label: string;
  /** 列表/详情中的小圆点 */
  dot: string;
  /** 甘特条背景 */
  bar: string;
  /** 浅色行背景（可选） */
  rowBg: string;
  /** 左侧强调条 */
  stripe: string;
}

export const STATUS_STYLES: Record<VisualStatusKey, StatusStyle> = {
  todo: {
    key: "todo",
    label: "待办",
    dot: "bg-amber-400 ring-amber-300",
    bar: "bg-amber-500 shadow-sm ring-1 ring-amber-600/30",
    rowBg: "bg-white",
    stripe: "border-l-amber-400",
  },
  in_progress: {
    key: "in_progress",
    label: "进行中",
    dot: "bg-blue-500 ring-blue-300",
    bar: "bg-blue-600 shadow-sm ring-1 ring-blue-700/30",
    rowBg: "bg-white",
    stripe: "border-l-blue-500",
  },
  done: {
    key: "done",
    label: "已完成",
    dot: "bg-emerald-500 ring-emerald-300",
    bar: "bg-emerald-600 shadow-sm ring-1 ring-emerald-700/30",
    rowBg: "bg-white",
    stripe: "border-l-emerald-500",
  },
  archived: {
    key: "archived",
    label: "已归档",
    dot: "bg-gray-400 ring-gray-300",
    bar: "bg-gray-500 shadow-sm ring-1 ring-gray-600/30",
    rowBg: "bg-white",
    stripe: "border-l-gray-400",
  },
  overdue: {
    key: "overdue",
    label: "超期",
    dot: "bg-red-500 ring-red-300",
    bar: "bg-red-600 shadow-sm ring-1 ring-red-700/30",
    rowBg: "bg-white",
    stripe: "border-l-red-500",
  },
};

/** 图例顺序（甘特图/任务页共用） */
export const STATUS_LEGEND: VisualStatusKey[] = [
  "todo",
  "in_progress",
  "done",
  "overdue",
  "archived",
];

const PLAN_TO_TASK: Record<string, VisualStatusKey> = {
  not_started: "todo",
  in_progress: "in_progress",
  done: "done",
  archived: "archived",
};

export function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
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
  return dueDate < todayDateOnly();
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

export function statusBarClass(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
): string {
  return getStatusStyle(status, dueDate, displayStatus).bar;
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
