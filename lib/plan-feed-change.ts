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

export interface PlanFeedChangeItem {
  label: string;
  before: string | null;
  after: string | null;
}

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

function formatDescriptionValue(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  if (text.length <= 40) return `「${text}」`;
  return `「${text.slice(0, 40)}…」`;
}

function normalizeChangeValue(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function pushChange(
  changes: PlanFeedChangeItem[],
  label: string,
  before: string | null,
  after: string | null,
) {
  const b = normalizeChangeValue(before);
  const a = normalizeChangeValue(after);
  if (b === a) return;
  changes.push({ label, before: b, after: a });
}

export function filterVisiblePlanChanges(
  changes: PlanFeedChangeItem[],
): PlanFeedChangeItem[] {
  return changes.filter((change) => {
    const b = normalizeChangeValue(change.before);
    const a = normalizeChangeValue(change.after);
    return b !== a;
  });
}

export function describePlanChanges(
  before: PlanFeedSnapshot,
  after: PlanFeedSnapshot,
): PlanFeedChangeItem[] {
  const changes: PlanFeedChangeItem[] = [];

  if (before.title !== after.title) {
    pushChange(changes, "标题", before.title, after.title);
  }
  if (before.description !== after.description) {
    pushChange(
      changes,
      "描述",
      formatDescriptionValue(before.description),
      formatDescriptionValue(after.description),
    );
  }
  if (!sameInstant(before.startDate, after.startDate)) {
    pushChange(
      changes,
      "开始时间",
      before.startDate ? formatFeedPlanDateChinese(before.startDate) : null,
      after.startDate ? formatFeedPlanDateChinese(after.startDate) : null,
    );
  }
  if (!sameInstant(before.endDate, after.endDate)) {
    pushChange(
      changes,
      "截至时间",
      before.endDate ? formatFeedPlanDateChinese(before.endDate) : null,
      after.endDate ? formatFeedPlanDateChinese(after.endDate) : null,
    );
  }
  if (!sameInstant(before.actualStartDate, after.actualStartDate)) {
    pushChange(
      changes,
      "实际开始时间",
      before.actualStartDate ? formatFeedPlanDateChinese(before.actualStartDate) : null,
      after.actualStartDate ? formatFeedPlanDateChinese(after.actualStartDate) : null,
    );
  }
  if (!sameInstant(before.actualEndDate, after.actualEndDate)) {
    pushChange(
      changes,
      "实际结束时间",
      before.actualEndDate ? formatFeedPlanDateChinese(before.actualEndDate) : null,
      after.actualEndDate ? formatFeedPlanDateChinese(after.actualEndDate) : null,
    );
  }
  if (before.status !== after.status) {
    pushChange(
      changes,
      "状态",
      STATUS_LABELS[before.status],
      STATUS_LABELS[after.status],
    );
  }
  if (before.type !== after.type) {
    pushChange(changes, "类型", TYPE_LABELS[before.type], TYPE_LABELS[after.type]);
  }
  if (before.priority !== after.priority) {
    pushChange(
      changes,
      "优先级",
      before.priority ? PRIORITY_LABELS[before.priority] : null,
      after.priority ? PRIORITY_LABELS[after.priority] : null,
    );
  }
  if (before.color !== after.color) {
    pushChange(
      changes,
      "颜色",
      before.color ? "已设置" : null,
      after.color ? "已设置" : null,
    );
  }
  if (before.parentPlanId !== after.parentPlanId) {
    pushChange(
      changes,
      "父计划",
      before.parentPlanId ? "已关联" : null,
      after.parentPlanId ? "已关联" : null,
    );
  }

  return changes;
}

export function serializePlanFeedChanges(changes: PlanFeedChangeItem[]): string {
  return JSON.stringify({ v: 1, changes });
}

export function parsePlanFeedContent(
  content: string | null | undefined,
  headline: string,
): { changes: PlanFeedChangeItem[] | null; legacySummary: string | null } {
  const raw = content?.trim();
  if (!raw || raw === headline.trim()) {
    return { changes: null, legacySummary: null };
  }
  try {
    const parsed = JSON.parse(raw) as { v?: number; changes?: PlanFeedChangeItem[] };
    if (parsed?.v === 1 && Array.isArray(parsed.changes)) {
      const changes = filterVisiblePlanChanges(parsed.changes);
      if (changes.length > 0) {
        return { changes, legacySummary: null };
      }
    }
  } catch {
    // 旧版纯文本摘要
  }
  return { changes: null, legacySummary: raw };
}
