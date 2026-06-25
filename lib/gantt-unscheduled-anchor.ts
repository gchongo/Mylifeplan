type PlanAnchorRow = {
  id: string;
  parentPlanId: string | null;
  startDate: string | null;
};

export function resolveUnscheduledGanttAnchor(
  parentPlanId: string | null,
  byId: Map<string, PlanAnchorRow>,
  computedAnchors: Map<string, string>,
  fallback: string,
): string {
  let cur = parentPlanId;
  while (cur) {
    const row = byId.get(cur);
    if (!row) break;
    if (row.startDate) return row.startDate;
    const inherited = computedAnchors.get(cur);
    if (inherited) return inherited;
    cur = row.parentPlanId;
  }
  return fallback;
}

export function planTreeDepth(planId: string, byId: Map<string, PlanAnchorRow>): number {
  let depth = 0;
  let cur = byId.get(planId)?.parentPlanId ?? null;
  while (cur) {
    depth += 1;
    cur = byId.get(cur)?.parentPlanId ?? null;
  }
  return depth;
}
