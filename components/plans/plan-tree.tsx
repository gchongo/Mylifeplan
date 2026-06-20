import Link from "next/link";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import type { PlanTreeNode } from "@/lib/plan-tree";

function PlanTreeBranch({ node, depth = 0 }: { node: PlanTreeNode; depth?: number }) {
  const isRoot = depth === 0;

  return (
    <li className={isRoot ? "rounded-xl border border-gray-200 bg-white p-4 shadow-sm" : undefined}>
      <div
        className={
          isRoot
            ? "flex items-center justify-between gap-2"
            : "flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
        }
      >
        <Link
          href={`/plans/${node.id}`}
          className={
            isRoot
              ? "text-lg font-semibold hover:text-brand-600"
              : "font-medium hover:text-brand-600"
          }
        >
          {node.title}
        </Link>
      </div>

      {node.tasks.length > 0 && (
        <ul
          className={
            isRoot
              ? "mt-3 space-y-1 border-l-2 border-brand-100 pl-4"
              : "mt-1 space-y-1 border-l border-gray-200 pl-4"
          }
        >
          {node.tasks.map((task) => (
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

      {node.children.length > 0 && (
        <ul
          className={
            isRoot
              ? "mt-3 space-y-3 border-l-2 border-brand-100 pl-4"
              : "mt-2 space-y-2 border-l border-gray-200 pl-3"
          }
        >
          {node.children.map((child) => (
            <PlanTreeBranch key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}

      {!isRoot && node.tasks.length === 0 && node.children.length === 0 && (
        <p className="mt-1 pl-2 text-xs text-gray-400">暂无子计划或关联任务</p>
      )}

      {isRoot && node.tasks.length === 0 && node.children.length === 0 && (
        <p className="mt-2 text-sm text-gray-400">暂无子计划或关联任务</p>
      )}
    </li>
  );
}

export function PlanTree({ roots }: { roots: PlanTreeNode[] }) {
  if (roots.length === 0) {
    return <p className="text-sm text-gray-500">暂无计划，请在上方新建。</p>;
  }

  return (
    <ul className="space-y-4">
      {roots.map((node) => (
        <PlanTreeBranch key={node.id} node={node} />
      ))}
    </ul>
  );
}
