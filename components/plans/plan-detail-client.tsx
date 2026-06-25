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
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import { isPlanUnscheduled } from "@/lib/content-router";
import { describeAggregatedActualTimes, type AggregatedChildNode } from "@/lib/gantt-actual-timeline";
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
  const { t } = useI18n();
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

  function afterChange(options?: { skipDispatch?: boolean }) {
    if (!options?.skipDispatch) dispatchPlanUpdated();
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
    if (!confirm(t("common.confirmDeletePlan"))) return;
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
          label: t("planDetail.restore"),
          icon: <MenuIconRestore />,
          onClick: () => void restorePlan(),
          disabled: deleting,
        },
        {
          id: "delete",
          label: t("planDetail.delete"),
          icon: <MenuIconDelete />,
          onClick: () => void handleDelete(),
          destructive: true,
          disabled: deleting,
        },
      ]
    : [
        { id: "edit", label: t("planDetail.edit"), icon: <MenuIconEdit />, onClick: () => setShowEdit(true) },
        { id: "sub", label: t("planDetail.subPlan"), icon: <MenuIconSubPlan />, onClick: () => openCompose("plan") },
        {
          id: "contrib",
          label: t("planDetail.contribution"),
          icon: <MenuIconContribution />,
          onClick: () => openCompose("contribution"),
        },
        {
          id: "archive",
          label: t("planDetail.archive"),
          icon: <MenuIconArchive />,
          onClick: () => void archivePlan(),
          disabled: deleting,
        },
        {
          id: "delete",
          label: t("planDetail.delete"),
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

  const hasSubPlans = subPlans.length > 0;
  const aggregatedActual = hasSubPlans
    ? describeAggregatedActualTimes(
        subPlans.map(
          (sp): AggregatedChildNode => ({
            status: sp.status,
            startDate: sp.startDate ?? null,
            endDate: sp.endDate ?? null,
            actualStartDate: sp.actualStartDate ?? null,
            actualEndDate: sp.actualEndDate ?? null,
          }),
        ),
      )
    : null;

  if (showEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("planDetail.editPlan")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm
            plan={{ ...plan, status }}
            hasSubPlans={hasSubPlans}
            contributionCount={contributions.length}
            redirectTo={embedded ? undefined : `/plans/${plan.id}`}
            submitLabel={t("common.save")}
            onCancel={() => setShowEdit(false)}
            onSuccess={() => {
              setShowEdit(false);
              afterChange({ skipDispatch: true });
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
            startDate={plan.startDate}
            endDate={plan.endDate}
            overdue={overdue}
            isUnscheduled={isPlanUnscheduled({ startDate: plan.startDate, endDate: plan.endDate })}
            onStatusChanged={(next: PlanStatus) => {
              setStatus(next);
              afterChange({ skipDispatch: true });
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
            <Button variant="ghost" size="sm" onClick={onClose} aria-label={t("common.close")} className="shrink-0 px-2">
              ✕
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          {plan.description && (
            <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200">{plan.description}</p>
          )}

          {!embedded && (
            <dl className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
              <dt className="text-gray-500">{t("planDetail.planStart")}</dt>
              <dd>{formatPlanDateTimeDisplay(plan.startDate)}</dd>
              <dt className="text-gray-500">{t("planDetail.planEnd")}</dt>
              <dd>{formatPlanDateTimeDisplay(plan.endDate)}</dd>
              <dt className="text-gray-500">{t("planDetail.actualStart")}</dt>
              <dd>
                {hasSubPlans
                  ? aggregatedActual?.start
                    ? formatPlanDateTimeDisplay(aggregatedActual.start)
                    : "—"
                  : formatPlanDateTimeDisplay(plan.actualStartDate)}
                {hasSubPlans && (
                  <span className="ml-1 text-xs text-gray-400">{t("planDetail.childRollup")}</span>
                )}
              </dd>
              <dt className="text-gray-500">{t("planDetail.actualEnd")}</dt>
              <dd>
                {hasSubPlans ? (
                  aggregatedActual?.end ? (
                    <>
                      {formatPlanDateTimeDisplay(aggregatedActual.end)}
                      {aggregatedActual.endOpen && (
                        <span className="ml-1 text-xs text-gray-400">{t("planDetail.untilNow")}</span>
                      )}
                      <span className="ml-1 text-xs text-gray-400">{t("planDetail.childRollup")}</span>
                    </>
                  ) : (
                    "—"
                  )
                ) : (
                  formatPlanDateTimeDisplay(plan.actualEndDate)
                )}
              </dd>
            </dl>
          )}
        </CardContent>
      </Card>

      <PlanContributionComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title={t("planDetail.addPlanOrContribution")}
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
