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
      shell: "border-2 border-solid border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/45",
      text: "text-amber-900 dark:text-amber-100 font-semibold",
    },
    child: {
      shell: "border border-solid border-amber-400 bg-amber-100 dark:border-amber-500/80 dark:bg-amber-950/50",
      text: "text-amber-900 dark:text-amber-200 font-normal",
    },
  },
  in_progress: {
    parent: {
      shell: "border-2 border-solid border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/50",
      text: "text-blue-800 dark:text-blue-100 font-semibold",
    },
    child: {
      shell: "border border-solid border-blue-400 bg-blue-100 dark:border-blue-500/80 dark:bg-blue-950/60",
      text: "text-blue-800 dark:text-blue-200 font-normal",
    },
  },
  done: {
    parent: {
      shell:
        "border-2 border-solid border-emerald-500 bg-emerald-50 opacity-90 dark:border-emerald-500 dark:bg-emerald-950/40",
      text: "text-emerald-800 dark:text-emerald-100 font-semibold",
    },
    child: {
      shell:
        "border border-solid border-emerald-400 bg-emerald-50 opacity-75 dark:border-emerald-600/80 dark:bg-emerald-950/35",
      text: "text-emerald-800 dark:text-emerald-200 font-normal",
    },
  },
  archived: {
    parent: {
      shell: "border-2 border-solid border-gray-300 bg-gray-50/80 opacity-60 dark:border-gray-600 dark:bg-gray-900/50",
      text: "text-gray-600 dark:text-gray-400 font-semibold",
    },
    child: {
      shell: "border border-solid border-gray-300 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-900/40",
      text: "text-gray-600 dark:text-gray-400 font-normal",
    },
  },
  overdue: {
    parent: {
      shell: "border-2 border-solid border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-950/45",
      text: "text-red-800 dark:text-red-100 font-semibold",
    },
    child: {
      shell: "border border-solid border-red-400 bg-red-50 dark:border-red-500/80 dark:bg-red-950/40",
      text: "text-red-800 dark:text-red-200 font-normal",
    },
  },
  unscheduled: {
    parent: {
      shell: "border-2 border-dashed border-violet-400 bg-violet-50/50 dark:border-violet-500/60 dark:bg-violet-950/30",
      text: "text-violet-700 dark:text-violet-300 font-semibold",
    },
    child: {
      shell: "border border-dashed border-violet-400 bg-violet-50/50 dark:border-violet-500/60 dark:bg-violet-950/30",
      text: "text-violet-700 dark:text-violet-300 font-normal",
    },
  },
};

export const STATUS_STYLES: Record<VisualStatusKey, StatusStyle> = {
  todo: {
    key: "todo",
    label: "未开始",
    dot: "bg-amber-500 ring-amber-300",
    bar: "bg-amber-500 shadow-sm ring-1 ring-amber-600/30",
    rowBg: "bg-white dark:bg-gray-900",
    stripe: "border-l-amber-500",
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

/** 解析最终用于上色的状态（未排期 / 汇总状态 / 超期优先） */
export function resolveVisualStatus(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
  overdue?: boolean,
  isUnscheduled?: boolean,
): VisualStatusKey {
  if (isUnscheduled) return "unscheduled";
  const effective = displayStatus ?? status ?? "todo";
  if (overdue) return "overdue";
  return normalizeStatusKey(effective);
}

export function getStatusStyle(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
  overdue?: boolean,
  isUnscheduled?: boolean,
): StatusStyle {
  return STATUS_STYLES[resolveVisualStatus(status, dueDate, displayStatus, overdue, isUnscheduled)];
}

export function getGanttBarStyle(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
  depth = 0,
  overdue?: boolean,
): GanttBarStyle {
  const visual = resolveVisualStatus(status, dueDate, displayStatus, overdue);
  return GANTT_BAR_STYLES[visual][depth > 0 ? "child" : "parent"];
}

export function statusBarClass(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
  depth = 0,
  overdue?: boolean,
): string {
  const { shell, text } = getGanttBarStyle(status, dueDate, displayStatus, depth, overdue);
  return `${shell} ${text}`;
}

/** 一级计划组框：中性壳子，不随计划自定义色变化 */
export function getGanttGroupShellClasses() {
  return {
    frame:
      "border-2 border-slate-300 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-900/35",
    tab: "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
  };
}

/** 甘特条：组内一级透明拖拽层；子计划/独立计划按状态实心上色 */
export function getStatusPlanBarAppearance(
  status: string | undefined | null,
  dueDate: string | null | undefined,
  opts: {
    depth: number;
    frameRoot?: boolean;
    displayStatus?: string | null;
    overdue?: boolean;
  },
): { shellClass: string; textClass: string } {
  if (opts.frameRoot) {
    return {
      shellClass: "border-0 bg-transparent shadow-none ring-0",
      textClass: "font-semibold",
    };
  }
  const { shell, text } = getGanttBarStyle(
    status,
    dueDate,
    opts.displayStatus,
    opts.depth,
    opts.overdue,
  );
  return { shellClass: shell, textClass: text };
}

/** 甘特左列：组内一级中性强调；其余按各自状态左条 */
export function getGanttLabelAppearance(
  status: string | undefined | null,
  dueDate: string | null | undefined,
  opts: {
    isGroupRoot?: boolean;
    displayStatus?: string | null;
    overdue?: boolean;
  },
): { stripeClass: string; bgClass: string } {
  if (opts.isGroupRoot) {
    return {
      stripeClass: "border-l-[3px] border-l-slate-300 dark:border-l-slate-600",
      bgClass: "bg-slate-50/40 dark:bg-slate-900/25",
    };
  }
  const style = getStatusStyle(status, dueDate, opts.displayStatus, opts.overdue);
  return {
    stripeClass: style.stripe,
    bgClass: "",
  };
}

export function statusLabel(
  status: string | undefined | null,
  dueDate?: string | null,
  displayStatus?: string | null,
  hasRollup?: boolean,
  overdue?: boolean,
): string {
  const style = getStatusStyle(status, dueDate, displayStatus, overdue);
  return hasRollup ? `${style.label}（汇总）` : style.label;
}

export function getKanbanColumnVisual(columnId: string): VisualStatusKey {
  switch (columnId) {
    case "unscheduled":
      return "unscheduled";
    case "archived":
      return "archived";
    case "in_progress":
      return "in_progress";
    case "done":
      return "done";
  }
  return "todo";
}

/** 看板卡片标题栏：与甘特条同色系的浅底 + 顶边强调 */
export function getKanbanTitleBarStyle(visual: VisualStatusKey): { shell: string; text: string } {
  switch (visual) {
    case "in_progress":
      return {
        shell: "border-t-[3px] border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/50",
        text: "text-blue-900 dark:text-blue-100",
      };
    case "done":
      return {
        shell: "border-t-[3px] border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40",
        text: "text-emerald-900 dark:text-emerald-100",
      };
    case "archived":
      return {
        shell: "border-t-[3px] border-gray-300 bg-gray-50/90 dark:border-gray-600 dark:bg-gray-900/50",
        text: "text-gray-700 dark:text-gray-300",
      };
    case "unscheduled":
      return {
        shell:
          "border-t-[3px] border-dashed border-violet-400 bg-violet-50/60 dark:border-violet-500/60 dark:bg-violet-950/30",
        text: "text-violet-800 dark:text-violet-200",
      };
    default:
      return {
        shell: "border-t-[3px] border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/45",
        text: "text-amber-900 dark:text-amber-100",
      };
  }
}

export function getKanbanColumnAccentClass(visual: VisualStatusKey): string {
  return STATUS_STYLES[visual].dot.split(" ")[0] ?? "bg-gray-400";
}

/** 移动端甘特表头：计划列单元格只读状态底色（与看板标题栏同色系） */
export function getMobilePlanHeaderStatusCellClass(visual: VisualStatusKey): string {
  switch (visual) {
    case "in_progress":
      return "bg-blue-50 dark:bg-blue-950/50";
    case "done":
      return "bg-emerald-50 dark:bg-emerald-950/40";
    case "archived":
      return "bg-gray-50/90 dark:bg-gray-900/50";
    case "overdue":
      return "bg-red-50 dark:bg-red-950/40";
    case "unscheduled":
      return "border border-dashed border-violet-300/80 bg-violet-50/60 dark:border-violet-500/50 dark:bg-violet-950/30";
    default:
      return "bg-amber-50 dark:bg-amber-950/45";
  }
}

export function asTaskStatusForRollup(status: string | undefined | null): TaskStatus {
  const key = normalizeStatusKey(status);
  if (key === "overdue") return "todo";
  return key as TaskStatus;
}
