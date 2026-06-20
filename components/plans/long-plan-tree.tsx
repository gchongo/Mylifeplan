import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface PhaseNode {
  id: string;
  title: string;
  type: string;
  status: string;
  taskCount: number;
}

interface GoalNode {
  id: string;
  title: string;
  type: string;
  status: string;
  phases: PhaseNode[];
}

export function LongPlanTree({ goals }: { goals: GoalNode[] }) {
  if (goals.length === 0) {
    return <p className="text-sm text-gray-500">暂无长期规划，请在上方创建 goal 或 phase。</p>;
  }

  return (
    <ul className="space-y-4">
      {goals.map((goal) => (
        <li key={goal.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/plans/${goal.id}`} className="text-lg font-semibold hover:text-brand-600">
              {goal.title}
            </Link>
            <Badge variant="info">{goal.type}</Badge>
          </div>
          {goal.phases.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">暂无阶段计划</p>
          ) : (
            <ul className="mt-3 space-y-2 border-l-2 border-brand-100 pl-4">
              {goal.phases.map((phase) => (
                <li
                  key={phase.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <Link href={`/plans/${phase.id}`} className="font-medium hover:text-brand-600">
                    {phase.title}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{phase.taskCount} 个任务</span>
                    <Badge variant="info">{phase.type}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
