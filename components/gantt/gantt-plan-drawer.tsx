"use client";

import { useEffect, useState } from "react";
import { DrawerPanel } from "@/components/ui/drawer";
import { Loading } from "@/components/ui/feedback";
import { PlanDetailClient } from "@/components/plans/plan-detail-client";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { PlanFormValues } from "@/components/forms/plan-form";
import type { PlanContributionItem } from "@/components/plans/plan-contribution-timeline";
import { isSubPlanOverdueAgainstParent, planOverdueNode } from "@/lib/gantt-plan-status";
import type { PlanRelationNode } from "@/lib/plan-relationship";

interface PlanPayload extends PlanFormValues {
  id: string;
  ancestors?: PlanRelationNode[];
  subPlans?: Array<PlanFormValues & { id: string }>;
}

export function GanttPlanDrawerPanel({
  planId,
  onClose,
  onPlanChange,
}: {
  planId: string;
  onClose: () => void;
  onPlanChange?: (planId: string) => void;
}) {
  const { t } = useI18n();
  const [activePlanId, setActivePlanId] = useState(planId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [ancestors, setAncestors] = useState<PlanRelationNode[]>([]);
  const [subPlans, setSubPlans] = useState<PlanRelationNode[]>([]);
  const [contributions, setContributions] = useState<PlanContributionItem[]>([]);
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    setActivePlanId(planId);
  }, [planId]);

  function loadPlan(id: string) {
    setLoading(true);
    setError("");
    setPlan(null);
    setAncestors([]);
    setSubPlans([]);
    setContributions([]);

    Promise.all([
      fetch(`/api/plans/${id}`).then((r) => r.json()),
      fetch(`/api/contributions?planId=${id}&includeSubtree=true`).then((r) => r.json()),
    ])
      .then(([planData, contribData]) => {
        if (!planData.plan) {
          setError(t("common.planNotFound"));
          return;
        }
        const payload = planData.plan as PlanPayload;
        setPlan(payload);
        const ancestorList = payload.ancestors ?? [];
        setAncestors(ancestorList);

        const currentNode = planOverdueNode(payload);
        const immediateParent = ancestorList[ancestorList.length - 1];
        setOverdue(
          immediateParent
            ? isSubPlanOverdueAgainstParent(currentNode, planOverdueNode(immediateParent))
            : false,
        );

        setSubPlans(
          (payload.subPlans ?? []).map((sp) => ({
            id: sp.id,
            title: sp.title,
            status: sp.status ?? "not_started",
            startDate: sp.startDate ?? null,
            endDate: sp.endDate ?? null,
            actualStartDate: sp.actualStartDate ?? null,
            actualEndDate: sp.actualEndDate ?? null,
            overdue: isSubPlanOverdueAgainstParent(planOverdueNode(sp), currentNode),
          })),
        );
        setContributions(contribData.contributions ?? []);
      })
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPlan(activePlanId);
  }, [activePlanId]);

  return (
    <DrawerPanel onClose={onClose} className="p-0">
      {loading && <Loading label={t("plans.loadingPlan")} />}
      {!loading && error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
      {!loading && plan && (
        <div className="p-4">
          <PlanDetailClient
            plan={plan}
            ancestors={ancestors}
            subPlans={subPlans}
            contributions={contributions}
            overdue={overdue}
            embedded
            onChanged={() => loadPlan(activePlanId)}
            onClose={onClose}
            onNavigatePlan={(id) => {
              setActivePlanId(id);
              onPlanChange?.(id);
            }}
          />
        </div>
      )}
    </DrawerPanel>
  );
}
