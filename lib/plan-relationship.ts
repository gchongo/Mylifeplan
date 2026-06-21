export interface PlanRelationNode {
  id: string;
  title: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  overdue?: boolean;
}

type PlanWithNestedParent = {
  id: string;
  title: string;
  status: string;
  startDate?: Date | null;
  endDate?: Date | null;
  parentPlan?: PlanWithNestedParent | null;
};

export function collectPlanAncestors(
  plan: { parentPlan?: PlanWithNestedParent | null },
  formatDates?: (p: PlanWithNestedParent) => { startDate: string | null; endDate: string | null },
): PlanRelationNode[] {
  const ancestors: PlanRelationNode[] = [];
  let cur = plan.parentPlan;
  while (cur) {
    const dates = formatDates?.(cur);
    ancestors.unshift({
      id: cur.id,
      title: cur.title,
      status: cur.status,
      startDate: dates?.startDate,
      endDate: dates?.endDate,
    });
    cur = cur.parentPlan ?? null;
  }
  return ancestors;
}
