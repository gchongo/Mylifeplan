"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Loading } from "@/components/ui/feedback";
import { useI18n } from "@/components/i18n/i18n-provider";
import { PlanDetailClient } from "@/components/plans/plan-detail-client";
import type { PlanFormValues } from "@/components/forms/plan-form";
import type { PlanContributionItem } from "@/components/plans/plan-contribution-timeline";
import { isSubPlanOverdueAgainstParent, planOverdueNode } from "@/lib/gantt-plan-status";
import type { PlanRelationNode } from "@/lib/plan-relationship";

interface PlanPayload extends PlanFormValues {
  id: string;
  ancestors?: PlanRelationNode[];
  subPlans?: Array<PlanFormValues & { id: string }>;
}

export function PlanDetailModal({
  planId,
  open,
  onClose,
  onChanged,
}: {
  planId: string | null;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const { t } = useI18n();
  const [activePlanId, setActivePlanId] = useState<string | null>(planId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [ancestors, setAncestors] = useState<PlanRelationNode[]>([]);
  const [subPlans, setSubPlans] = useState<PlanRelationNode[]>([]);
  const [contributions, setContributions] = useState<PlanContributionItem[]>([]);
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    if (open && planId) setActivePlanId(planId);
  }, [open, planId]);

  const loadPlan = useCallback(
    (id: string) => {
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
              overdue: isSubPlanOverdueAgainstParent(planOverdueNode(sp), currentNode),
            })),
          );
          setContributions(contribData.contributions ?? []);
        })
        .catch(() => setError(t("common.loadFailed")))
        .finally(() => setLoading(false));
    },
    [t],
  );

  useEffect(() => {
    if (!open || !activePlanId) return;
    loadPlan(activePlanId);
  }, [open, activePlanId, loadPlan]);

  const handleChanged = useCallback(() => {
    onChanged?.();
    if (activePlanId) loadPlan(activePlanId);
  }, [activePlanId, loadPlan, onChanged]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={null}
      showCloseButton={false}
      className="max-h-[90vh] max-w-2xl overflow-y-auto"
    >
      {loading && <Loading label={t("plans.loadingPlan")} />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && plan && (
        <PlanDetailClient
          plan={plan}
          ancestors={ancestors}
          subPlans={subPlans}
          contributions={contributions}
          overdue={overdue}
          embedded
          onChanged={handleChanged}
          onClose={onClose}
          onNavigatePlan={setActivePlanId}
        />
      )}
    </Modal>
  );
}
