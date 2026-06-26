import { isPlanUnscheduled } from "@/lib/content-router";
import { datetimeLocalToIso, normalizePlanDateInput, toDatetimeLocalInput } from "@/lib/dates";
import {
  kanbanCanMoveToUnscheduled,
  UNSCHEDULED_BLOCKED_HINT,
  type KanbanPlan,
} from "@/lib/kanban-board";
import type { PlanStatus } from "@/types";

export type ScheduleTransitionTarget =
  | "unscheduled"
  | "not_started"
  | "in_progress"
  | "done"
  | "archived";

export interface ScheduleTransitionPatch {
  status: PlanStatus;
  startDate?: string | null;
  endDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
}

export type PlanScheduleTransitionInput = KanbanPlan & {
  actualStartDate?: string | null;
  actualEndDate?: string | null;
};

function nowLocal(now: Date): string {
  return toDatetimeLocalInput(now);
}

/**
 * 统一的计划排期/状态切换 PATCH（甘特状态菜单、看板拖放、表单共用）。
 * 日期字段使用 datetime-local 字符串，提交前由 normalizeSchedulePatchForApi 转 ISO。
 */
export function buildPlanScheduleTransitionPatch(
  plan: PlanScheduleTransitionInput,
  target: ScheduleTransitionTarget,
  now: Date = new Date(),
): ScheduleTransitionPatch {
  const unscheduled = isPlanUnscheduled({ startDate: plan.startDate, endDate: plan.endDate });
  const nowStr = nowLocal(now);

  switch (target) {
    case "unscheduled": {
      if (!kanbanCanMoveToUnscheduled(plan)) {
        throw new Error(UNSCHEDULED_BLOCKED_HINT);
      }
      return {
        status: "not_started",
        startDate: null,
        endDate: null,
        actualStartDate: null,
        actualEndDate: null,
      };
    }

    case "archived":
      return { status: "archived" };

    case "not_started": {
      if (unscheduled) {
        return {
          status: "not_started",
          startDate: nowStr,
        };
      }
      // 进行中/已完成 → 未开始：须清空实际时间，否则服务端会按 actualStart 推回进行中
      if (plan.status === "in_progress" || plan.status === "done") {
        return {
          status: "not_started",
          actualStartDate: null,
          actualEndDate: null,
        };
      }
      return { status: "not_started" };
    }

    case "in_progress": {
      if (unscheduled) {
        return {
          status: "in_progress",
          startDate: nowStr,
          actualStartDate: nowStr,
        };
      }
      return { status: "in_progress" };
    }

    case "done": {
      if (unscheduled) {
        return {
          status: "done",
          startDate: nowStr,
          endDate: nowStr,
          actualStartDate: nowStr,
          actualEndDate: nowStr,
        };
      }
      const patch: ScheduleTransitionPatch = { status: "done" };
      if (!plan.endDate) {
        patch.endDate = nowStr;
      }
      return patch;
    }
  }
}

const DATE_KEYS = ["startDate", "endDate", "actualStartDate", "actualEndDate"] as const;

/** 将 transition patch 中的 datetime-local 转为 API ISO 字符串 */
export function normalizeSchedulePatchForApi(
  patch: ScheduleTransitionPatch,
): Record<string, unknown> {
  const body: Record<string, unknown> = { ...patch };
  for (const key of DATE_KEYS) {
    if (!(key in body)) continue;
    const val = body[key];
    if (val === null || val === undefined) {
      body[key] = null;
      continue;
    }
    if (typeof val !== "string" || !val.trim()) {
      body[key] = null;
      continue;
    }
    const kind = key === "endDate" || key === "actualEndDate" ? "end" : "start";
    const normalized = normalizePlanDateInput(val, kind);
    body[key] = normalized ? datetimeLocalToIso(normalized) : null;
  }
  return body;
}
