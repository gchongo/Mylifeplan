"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import type { PlanRelationNode } from "@/lib/plan-relationship";
import { cn } from "@/lib/utils";

function RelationArrow() {
  return (
    <div className="flex justify-center py-1 text-gray-300" aria-hidden>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M12 5v14M7 14l5 5 5-5" />
      </svg>
    </div>
  );
}

function RelationNodeRow({
  node,
  variant,
  onNavigate,
}: {
  node: PlanRelationNode;
  variant: "ancestor" | "current" | "child";
  onNavigate?: (planId: string) => void;
}) {
  const clickable = variant !== "current" && onNavigate;

  const inner = (
    <>
      <span className="min-w-0 flex-1 truncate text-sm">{node.title}</span>
      <TaskStatusIndicator status={node.status} overdue={node.overdue} size="xs" />
    </>
  );

  const className = cn(
    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left",
    variant === "current" &&
      "rounded-lg border-2 border-brand-200 bg-brand-50/60 font-medium text-gray-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-gray-100",
    variant === "ancestor" &&
      "rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200 dark:hover:bg-gray-800",
    variant === "child" &&
      "rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800",
  );

  if (clickable) {
    return (
      <button type="button" onClick={() => onNavigate(node.id)} className={className}>
        {inner}
      </button>
    );
  }

  if (variant !== "current" && !onNavigate) {
    return (
      <Link href={`/plans/${node.id}`} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function PlanRelationshipCard({
  currentPlan,
  ancestors,
  childPlans,
  onNavigatePlan,
}: {
  currentPlan: PlanRelationNode;
  ancestors: PlanRelationNode[];
  childPlans: PlanRelationNode[];
  onNavigatePlan?: (planId: string) => void;
}) {
  if (ancestors.length === 0 && childPlans.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">计划关系</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {ancestors.map((node) => (
          <div key={node.id}>
            <RelationNodeRow node={node} variant="ancestor" onNavigate={onNavigatePlan} />
            <RelationArrow />
          </div>
        ))}

        <RelationNodeRow node={currentPlan} variant="current" />

        {childPlans.length > 0 && (
          <>
            <RelationArrow />
            <div className="space-y-2">
              {childPlans.map((node) => (
                <RelationNodeRow key={node.id} node={node} variant="child" onNavigate={onNavigatePlan} />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
