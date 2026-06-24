"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import type { PlanRelationNode } from "@/lib/plan-relationship";
import { cn } from "@/lib/utils";

function RelationArrow() {
  return (
    <div className="flex justify-center py-2 text-brand-500/80 dark:text-brand-400/90" aria-hidden>
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v11" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l4 4 4-4" />
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
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          variant === "current" && "text-base font-semibold",
          variant !== "current" && "text-sm font-medium",
        )}
      >
        {node.title}
      </span>
      <span className={cn("shrink-0", variant !== "current" && "opacity-80")}>
        <TaskStatusIndicator status={node.status} overdue={node.overdue} size="xs" />
      </span>
    </>
  );

  const className = cn(
    "flex w-full items-center justify-between gap-2 text-left transition-[opacity,background-color,box-shadow] duration-200 ease-out",
    variant === "current" &&
      "rounded-full border-2 border-brand-400 bg-brand-50/75 px-4 py-2.5 text-gray-900 shadow-sm dark:border-brand-500 dark:bg-brand-950/45 dark:text-gray-50",
    variant === "ancestor" &&
      "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:bg-gray-800/60 dark:hover:text-gray-100",
    variant === "child" &&
      "rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-gray-100",
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

        <div key={currentPlan.id} className="transition-opacity duration-200">
          <RelationNodeRow node={currentPlan} variant="current" />
        </div>

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
