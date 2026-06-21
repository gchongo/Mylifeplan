"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm, type PlanFormValues } from "@/components/forms/plan-form";
import { PlanContributionComposeModal } from "@/components/forms/plan-contribution-compose-modal";
import type { PlanContributionComposeMode } from "@/components/forms/plan-contribution-compose-form";
import { PlanContributionTimeline, type PlanContributionItem } from "@/components/plans/plan-contribution-timeline";
import { PlanRelationshipCard } from "@/components/plans/plan-relationship-card";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import type { PlanRelationNode } from "@/lib/plan-relationship";

export function PlanDetailClient({
  plan,
  ancestors = [],
  subPlans,
  contributions = [],
  overdue = false,
  embedded = false,
  onChanged,
  onClose,
  onNavigatePlan,
}: {
  plan: PlanFormValues & { id: string };
  ancestors?: PlanRelationNode[];
  subPlans: PlanRelationNode[];
  contributions?: PlanContributionItem[];
  overdue?: boolean;
  embedded?: boolean;
  onChanged?: () => void;
  onClose?: () => void;
  onNavigatePlan?: (planId: string) => void;
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<PlanContributionComposeMode>("plan");
  const [deleting, setDeleting] = useState(false);

  function openCompose(mode: PlanContributionComposeMode) {
    setComposeMode(mode);
    setComposeOpen(true);
  }

  function afterChange() {
    dispatchPlanUpdated();
    onChanged?.();
  }

  function leaveAfterDelete() {
    if (embedded) {
      onClose?.();
    } else {
      router.push("/plans");
      router.refresh();
    }
  }

  async function archivePlan() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (res.ok) {
        afterChange();
        leaveAfterDelete();
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("确定删除此计划？")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
      if (res.ok) {
        afterChange();
        leaveAfterDelete();
      }
    } finally {
      setDeleting(false);
    }
  }

  const currentRelation: PlanRelationNode = {
    id: plan.id,
    title: plan.title,
    status: plan.status ?? "not_started",
    overdue,
  };

  if (showEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>编辑计划</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm
            plan={plan}
            redirectTo={embedded ? undefined : `/plans/${plan.id}`}
            onSuccess={() => {
              setShowEdit(false);
              afterChange();
            }}
          />
          <Button className="mt-4" variant="ghost" size="sm" onClick={() => setShowEdit(false)}>
            取消编辑
          </Button>
        </CardContent>
      </Card>
    );
  }

  const scheduleLine = [formatPlanDateTimeDisplay(plan.startDate), formatPlanDateTimeDisplay(plan.endDate)]
    .filter((v) => v !== "—")
    .join(" — ");

  return (
    <div className="space-y-4">
      <Card>
        {!embedded && (
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <CardTitle className="text-xl">{plan.title}</CardTitle>
            <TaskStatusIndicator
              status={plan.status ?? "not_started"}
              dueDate={plan.endDate}
              overdue={overdue}
              showLabel
            />
          </CardHeader>
        )}
        <CardContent className={cnEmbedded(embedded, "space-y-3 text-sm text-gray-700")}>
          {embedded && (
            <TaskStatusIndicator
              status={plan.status ?? "not_started"}
              dueDate={plan.endDate}
              overdue={overdue}
              showLabel
            />
          )}

          {plan.description && <p className="leading-relaxed">{plan.description}</p>}

          {scheduleLine && (
            <p className="text-xs text-gray-500">{scheduleLine}</p>
          )}

          {!embedded && (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">开始</dt>
              <dd>{formatPlanDateTimeDisplay(plan.startDate)}</dd>
              <dt className="text-gray-500">结束</dt>
              <dd>{formatPlanDateTimeDisplay(plan.endDate)}</dd>
            </dl>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {plan.status !== "archived" && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
                  编辑
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openCompose("plan")}>
                  子计划
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openCompose("contribution")}>
                  贡献
                </Button>
              </>
            )}
            {plan.status === "archived" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await fetch(`/api/plans/${plan.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "not_started" }),
                  });
                  afterChange();
                  if (!embedded) router.refresh();
                }}
              >
                取消归档
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={archivePlan} disabled={deleting}>
                归档
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleDelete} disabled={deleting}>
              删除
            </Button>
          </div>
        </CardContent>
      </Card>

      <PlanContributionComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="添加计划或贡献"
        defaultMode={composeMode}
        fixedParentPlanId={plan.id}
        fixedPlanId={plan.id}
        onSuccess={() => {
          afterChange();
          if (!embedded) router.refresh();
        }}
      />

      <PlanRelationshipCard
        currentPlan={currentRelation}
        ancestors={ancestors}
        childPlans={subPlans}
        onNavigatePlan={onNavigatePlan}
      />

      <PlanContributionTimeline
        contributions={contributions}
        currentPlanId={plan.id}
        onChanged={() => {
          afterChange();
          if (!embedded) router.refresh();
        }}
      />
    </div>
  );
}

function cnEmbedded(embedded: boolean, base: string) {
  return embedded ? `${base} pt-4` : base;
}
