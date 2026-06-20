import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";

interface TaskNode {
  id: string;
  title: string;
  status: string;
}

interface PhaseNode {
  id: string;
  title: string;
  type: string;
  status: string;
  tasks: TaskNode[];
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
            <ul className="mt-3 space-y-3 border-l-2 border-brand-100 pl-4">
              {goal.phases.map((phase) => (
                <li key={phase.id}>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <Link href={`/plans/${phase.id}`} className="font-medium hover:text-brand-600">
                      {phase.title}
                    </Link>
                    <Badge variant="info">{phase.type}</Badge>
                  </div>
                  {phase.tasks.length === 0 ? (
                    <p className="mt-1 pl-2 text-xs text-gray-400">暂无关联任务</p>
                  ) : (
                    <ul className="mt-1 space-y-1 border-l border-gray-200 pl-4">
                      {phase.tasks.map((task) => (
                        <li key={task.id}>
                          <Link
                            href={`/tasks/${task.id}`}
                            className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-gray-50"
                          >
                            <span>{task.title}</span>
                            <TaskStatusIndicator status={task.status} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
