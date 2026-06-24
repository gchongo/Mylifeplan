import type { Plan, PlanPriority, PlanStatus, PlanType } from "@prisma/client";
import { formatPlanDateTime, formatPlanDateTimeDisplay } from "@/lib/dates";

const STATUS_LABELS: Record<PlanStatus, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  done: "已完成",
  archived: "已归档",
};

const TYPE_LABELS: Record<PlanType, string> = {
  goal: "目标",
  phase: "阶段",
  weekly: "周计划",
  daily: "日计划",
};

const PRIORITY_LABELS: Record<PlanPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export type PlanFeedSnapshot = Pick<
  Plan,
  | "title"
  | "description"
  | "startDate"
  | "endDate"
  | "actualStartDate"
  | "actualEndDate"
  | "status"
  | "type"
  | "priority"
  | "color"
  | "parentPlanId"
>;

export function planToFeedSnapshot(plan: PlanFeedSnapshot): PlanFeedSnapshot {
  return {
    title: plan.title,
    description: plan.description,
    startDate: plan.startDate,
    endDate: plan.endDate,
    actualStartDate: plan.actualStartDate,
    actualEndDate: plan.actualEndDate,
    status: plan.status,
    type: plan.type,
    priority: plan.priority,
    color: plan.color,
    parentPlanId: plan.parentPlanId,
  };
}

/** 信息流中展示的计划时间：2026年6月26日 或带时分 */
export function formatFeedPlanDateChinese(value: Date | null | undefined): string {
  if (!value) return "未设置";
  const iso = formatPlanDateTime(value);
  if (!iso) return "未设置";
  const display = formatPlanDateTimeDisplay(iso);
  const match = display.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?: (\d{2}):(\d{2}))?$/);
  if (!match) return display;
  const y = match[1];
  const m = Number(match[2]);
  const d = Number(match[3]);
  const h = match[4];
  const min = match[5];
  if (!h || (h === "00" && min === "00")) {
    return `${y}年${m}月${d}日`;
  }
  return `${y}年${m}月${d}日 ${h}:${min}`;
}

function sameInstant(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}

function formatDescriptionChange(next: string | null): string {
  const text = next?.trim();
  if (!text) return "清除了描述";
  if (text.length <= 40) return `更新了描述为「${text}」`;
  return "更新了描述";
}

export function describePlanChanges(before: PlanFeedSnapshot, after: PlanFeedSnapshot): string[] {
  const changes: string[] = [];

  if (before.title !== after.title) {
    changes.push(`更新了标题为「${after.title}」`);
  }
  if (before.description !== after.description) {
    changes.push(formatDescriptionChange(after.description));
  }
  if (!sameInstant(before.startDate, after.startDate)) {
    if (after.startDate) {
      changes.push(`更新了开始时间为${formatFeedPlanDateChinese(after.startDate)}`);
    } else {
      changes.push("清除了开始时间");
    }
  }
  if (!sameInstant(before.endDate, after.endDate)) {
    if (after.endDate) {
      changes.push(`更新了截至时间为${formatFeedPlanDateChinese(after.endDate)}`);
    } else {
      changes.push("清除了截至时间");
    }
  }
  if (!sameInstant(before.actualStartDate, after.actualStartDate)) {
    if (after.actualStartDate) {
      changes.push(`更新了实际开始时间为${formatFeedPlanDateChinese(after.actualStartDate)}`);
    } else {
      changes.push("清除了实际开始时间");
    }
  }
  if (!sameInstant(before.actualEndDate, after.actualEndDate)) {
    if (after.actualEndDate) {
      changes.push(`更新了实际结束时间为${formatFeedPlanDateChinese(after.actualEndDate)}`);
    } else {
      changes.push("清除了实际结束时间");
    }
  }
  if (before.status !== after.status) {
    changes.push(`更新了状态为${STATUS_LABELS[after.status]}`);
  }
  if (before.type !== after.type) {
    changes.push(`更新了类型为${TYPE_LABELS[after.type]}`);
  }
  if (before.priority !== after.priority) {
    if (after.priority) {
      changes.push(`更新了优先级为${PRIORITY_LABELS[after.priority]}`);
    } else {
      changes.push("清除了优先级");
    }
  }
  if (before.color !== after.color) {
    changes.push(after.color ? "更新了颜色" : "清除了颜色");
  }
  if (before.parentPlanId !== after.parentPlanId) {
    changes.push(after.parentPlanId ? "更新了父计划" : "清除了父计划");
  }

  return changes;
}

export function joinPlanFeedChanges(changes: string[]): string {
  return changes.join("，");
}

/** 旧数据 content 存的是计划标题，与更新摘要区分 */
export function resolvePlanFeedUpdateSummary(
  content: string | null | undefined,
  headline: string,
): string | null {
  const raw = content?.trim();
  if (!raw) return null;
  if (raw === headline.trim()) return null;
  return raw;
}
