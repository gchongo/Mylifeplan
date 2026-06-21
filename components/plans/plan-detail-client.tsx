"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanForm, type PlanFormValues } from "@/components/forms/plan-form";
import { PlanContributionComposeModal } from "@/components/forms/plan-contribution-compose-modal";
import type { PlanContributionComposeMode } from "@/components/forms/plan-contribution-compose-form";
import { PlanContributionTimeline, type PlanContributionItem } from "@/components/plans/plan-contribution-timeline";
import { PlanRelationshipCard } from "@/components/plans/plan-relationship-card";
import {
  MenuIconArchive,
  MenuIconContribution,
  MenuIconDelete,
  MenuIconEdit,
  MenuIconRestore,
  MenuIconSubPlan,
  PlanDetailActionsMenu,
} from "@/components/plans/plan-detail-actions-menu";
import { PlanStatusMenuButton } from "@/components/plans/plan-status-menu";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import type { PlanRelationNode } from "@/lib/plan-relationship";
import type { PlanStatus } from "@/types";

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
  const [status, setStatus] = useState(plan.status ?? "not_started");

  useEffect(() => {
    setStatus(plan.status ?? "not_started");
  }, [plan.id, plan.status]);

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
        setStatus("archived");
        afterChange();
        leaveAfterDelete();
      }
    } finally {
      setDeleting(false);
    }
  }

  async function restorePlan() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "not_started" }),
      });
      if (res.ok) {
        setStatus("not_started");
        afterChange();
        if (!embedded) router.refresh();
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

  const archived = status === "archived";
  const menuItems = archived
    ? [
        {
          id: "restore",
          label: "取消归档",
          icon: <MenuIconRestore />,
          onClick: () => void restorePlan(),
          disabled: deleting,
        },
        {
          id: "delete",
          label: "删除",
          icon: <MenuIconDelete />,
          onClick: () => void handleDelete(),
          destructive: true,
          disabled: deleting,
        },
      ]
    : [
        { id: "edit", label: "编辑", icon: <MenuIconEdit />, onClick: () => setShowEdit(true) },
        { id: "sub", label: "子计划", icon: <MenuIconSubPlan />, onClick: () => openCompose("plan") },
        {
          id: "contrib",
          label: "贡献",
          icon: <MenuIconContribution />,
          onClick: () => openCompose("contribution"),
        },
        {
          id: "archive",
          label: "归档",
          icon: <MenuIconArchive />,
          onClick: () => void archivePlan(),
          disabled: deleting,
        },
        {
          id: "delete",
          label: "删除",
          icon: <MenuIconDelete />,
          onClick: () => void handleDelete(),
          destructive: true,
          disabled: deleting,
        },
      ];

  const currentRelation: PlanRelationNode = {
    id: plan.id,
    title: plan.title,
    status,
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
            plan={{ ...plan, status }}
            redirectTo={embedded ? undefined : `/plans/${plan.id}`}
            submitLabel="保存"
            onCancel={() => setShowEdit(false)}
            onSuccess={() => {
              setShowEdit(false);
              afterChange();
            }}
          />
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
        <CardHeader className="flex flex-row items-start gap-2 border-b-0 pb-0 pt-4">
          <PlanStatusMenuButton
            planId={plan.id}
            status={status}
            dueDate={plan.endDate}
            overdue={overdue}
            onStatusChanged={(next: PlanStatus) => {
              setStatus(next);
              afterChange();
              if (next === "archived") leaveAfterDelete();
            }}
          />
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base font-semibold leading-6">
              {plan.title}
            </CardTitle>
            {scheduleLine && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{scheduleLine}</p>
            )}
          </div>
          <PlanDetailActionsMenu items={menuItems} disabled={deleting} />
          {embedded && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="关闭" className="shrink-0 px-2">
              ✕
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-3 pt-2 text-sm text-gray-700 dark:text-gray-300">
          {plan.description && <p className="leading-relaxed">{plan.description}</p>}

          {!embedded && (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">开始</dt>
              <dd>{formatPlanDateTimeDisplay(plan.startDate)}</dd>
              <dt className="text-gray-500">结束</dt>
              <dd>{formatPlanDateTimeDisplay(plan.endDate)}</dd>
            </dl>
          )}
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
