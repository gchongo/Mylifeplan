import { findRootPlanId } from "@/lib/gantt-contribution-display";
import { normalizePlanColor, planColorRgba, resolveEffectivePlanColor } from "@/lib/plan-color";
import type { GanttContribution, GanttItem } from "@/types";

type PlanNode = Pick<GanttItem, "id" | "parentId" | "color">;

export const CONTRIBUTION_POINT_WIDTH_PX = 2;
export const CONTRIBUTION_INTERVAL_FILL_ALPHA = 0.55;

export function isContributionInterval(
  c: Pick<GanttContribution, "occurredOn" | "occurredEndOn">,
): boolean {
  if (!c.occurredEndOn) return false;
  const start = Date.parse(c.occurredOn);
  const end = Date.parse(c.occurredEndOn);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return end > start;
}

/** 自定义色优先；否则继承所属计划组（一级计划）颜色 */
export function resolveContributionMarkerColor(
  contribution: Pick<GanttContribution, "planId" | "markerColor">,
  planById: Map<string, PlanNode>,
): string {
  if (contribution.markerColor) {
    return normalizePlanColor(contribution.markerColor);
  }
  const rootId = findRootPlanId(contribution.planId, planById);
  const root = planById.get(rootId);
  return resolveEffectivePlanColor(root ?? { color: null }, root);
}

export function contributionIntervalFillStyle(color: string): { backgroundColor: string } {
  return { backgroundColor: planColorRgba(color, CONTRIBUTION_INTERVAL_FILL_ALPHA) };
}
