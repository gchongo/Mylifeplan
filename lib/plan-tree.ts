export interface PlanTreeTask {
  id: string;
  title: string;
  status: string;
  planId?: string | null;
}

export interface PlanTreeNode {
  id: string;
  title: string;
  status: string;
  tasks: PlanTreeTask[];
  children: PlanTreeNode[];
}

interface PlanRow {
  id: string;
  title: string;
  status: string;
  parentPlanId: string | null;
}

export function buildPlanTree(
  plans: PlanRow[],
  tasks: Array<{ id: string; title: string; status: string; planId: string | null }>,
): PlanTreeNode[] {
  const tasksByPlan = new Map<string, PlanTreeTask[]>();
  for (const task of tasks) {
    if (!task.planId) continue;
    const list = tasksByPlan.get(task.planId) ?? [];
    list.push({ id: task.id, title: task.title, status: task.status });
    tasksByPlan.set(task.planId, list);
  }

  const nodes = new Map<string, PlanTreeNode>();
  for (const plan of plans) {
    nodes.set(plan.id, {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      tasks: tasksByPlan.get(plan.id) ?? [],
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
