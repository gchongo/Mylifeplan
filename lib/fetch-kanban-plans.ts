import { apiJson } from "@/lib/client-api";
import type { KanbanPlan } from "@/lib/kanban-board";

/** 带 cache-bust 拉取看板计划，绕过 CDN/浏览器缓存 */
export async function fetchActiveKanbanPlans(): Promise<KanbanPlan[]> {
  const data = await apiJson<{ plans?: KanbanPlan[] }>(`/api/plans?_=${Date.now()}`);
  return data.plans ?? [];
}

export async function fetchArchivedKanbanPlans(): Promise<KanbanPlan[]> {
  const data = await apiJson<{ plans?: KanbanPlan[] }>(
    `/api/plans?status=archived&_=${Date.now()}`,
  );
  return data.plans ?? [];
}
