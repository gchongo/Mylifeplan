export interface PlanTreeNode {
  id: string;
  title: string;
  status: string;
  children: PlanTreeNode[];
}

interface PlanRow {
  id: string;
  title: string;
  status: string;
  parentPlanId: string | null;
}

export function buildPlanTree(plans: PlanRow[]): PlanTreeNode[] {
  const nodes = new Map<string, PlanTreeNode>();
  for (const plan of plans) {
    nodes.set(plan.id, {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      children: [],
    });
  }

  const roots: PlanTreeNode[] = [];
  for (const plan of plans) {
    const node = nodes.get(plan.id)!;
    if (plan.parentPlanId && nodes.has(plan.parentPlanId)) {
      nodes.get(plan.parentPlanId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
