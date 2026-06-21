import type { GanttContribution, GanttItem } from "@/types";

type PlanNode = Pick<GanttItem, "id" | "parentId">;

/** 一级计划 id */
export function findRootPlanId(planId: string, planById: Map<string, PlanNode>): string {
  let cur = planById.get(planId);
  if (!cur) return planId;
  while (cur.parentId && planById.has(cur.parentId)) {
    cur = planById.get(cur.parentId)!;
  }
  return cur.id;
}

/** 某计划及其全部后代 id */
export function collectPlanSubtreeIds(rootId: string, plans: PlanNode[]): Set<string> {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of plans) {
      if (p.parentId && ids.has(p.parentId) && !ids.has(p.id)) {
        ids.add(p.id);
        changed = true;
      }
    }
  }
  return ids;
}

function isPlanRowRendered(planId: string, visibleRowIds: Set<string>): boolean {
  return visibleRowIds.has(planId);
}

function isPlanRowExpandedVisible(
  planId: string,
  planById: Map<string, PlanNode>,
  expanded: Set<string>,
  visibleRowIds: Set<string>,
): boolean {
  if (!visibleRowIds.has(planId)) return false;
  let cur = planById.get(planId);
  while (cur?.parentId) {
    if (!expanded.has(cur.parentId)) return false;
    cur = planById.get(cur.parentId);
  }
  return true;
}

/**
 * 贡献记录在哪一行显示：
 * - 所属计划行可见 → 显示在该计划行
 * - 所属计划行不可见（父级折叠）→ 上卷到最近可见祖先行
 */
export function resolveContributionDisplayPlanId(
  contributionPlanId: string,
  planById: Map<string, PlanNode>,
  expanded: Set<string>,
  visibleRowIds: Set<string>,
): string | null {
  if (isPlanRowExpandedVisible(contributionPlanId, planById, expanded, visibleRowIds)) {
    return contributionPlanId;
  }

  let cur = planById.get(contributionPlanId);
  while (cur?.parentId) {
    const parentId = cur.parentId;
    if (isPlanRowExpandedVisible(parentId, planById, expanded, visibleRowIds)) {
      return parentId;
    }
    cur = planById.get(parentId);
  }

  if (isPlanRowRendered(contributionPlanId, visibleRowIds)) {
    return contributionPlanId;
  }
  return null;
}

export function contributionsForGanttRow(
  rowPlanId: string,
  contributions: GanttContribution[],
  planById: Map<string, PlanNode>,
  expanded: Set<string>,
  visibleRowIds: Set<string>,
): GanttContribution[] {
  return contributions.filter((c) => {
    const displayId = resolveContributionDisplayPlanId(
      c.planId,
      planById,
      expanded,
      visibleRowIds,
    );
    return displayId === rowPlanId;
  });
}

/** 贡献改绑计划：须在同一一级计划子树内 */
export function isPlanInSameRootSubtree(
  fromPlanId: string,
  toPlanId: string,
  plans: PlanNode[],
): boolean {
  const byId = new Map(plans.map((p) => [p.id, p]));
  const rootA = findRootPlanId(fromPlanId, byId);
  const rootB = findRootPlanId(toPlanId, byId);
  return rootA === rootB;
}
