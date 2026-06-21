"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Loading } from "@/components/ui/feedback";
import { PlanDetailClient } from "@/components/plans/plan-detail-client";
import type { PlanFormValues } from "@/components/forms/plan-form";
import type { PlanContributionItem } from "@/components/plans/plan-contribution-timeline";

interface PlanPayload extends PlanFormValues {
  id: string;
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
  const [activePlanId, setActivePlanId] = useState<string | null>(planId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [subPlans, setSubPlans] = useState<{ id: string; title: string; status: string }[]>([]);
  const [contributions, setContributions] = useState<PlanContributionItem[]>([]);

  useEffect(() => {
    if (open && planId) setActivePlanId(planId);
  }, [open, planId]);

  function loadPlan(id: string) {
    setLoading(true);
    setError("");
    setPlan(null);
    setSubPlans([]);
    setContributions([]);

    Promise.all([
      fetch(`/api/plans/${id}`).then((r) => r.json()),
      fetch(`/api/contributions?planId=${id}&includeSubtree=true`).then((r) => r.json()),
    ])
      .then(([planData, contribData]) => {
        if (!planData.plan) {
          setError("计划不存在");
          return;
        }
        setPlan(planData.plan);
        setSubPlans(
          (planData.plan.subPlans ?? []).map(
            (sp: { id: string; title: string; status: string }) => ({
              id: sp.id,
              title: sp.title,
              status: sp.status,
            }),
          ),
        );
        setContributions(contribData.contributions ?? []);
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!open || !activePlanId) return;
    loadPlan(activePlanId);
  }, [open, activePlanId]);

  function handleChanged() {
    onChanged?.();
    if (activePlanId) loadPlan(activePlanId);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={plan?.title ?? "计划详情"}
      className="max-h-[90vh] max-w-2xl overflow-y-auto"
    >
      {loading && <Loading label="加载计划…" />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && plan && (
        <PlanDetailClient
          plan={plan}
          subPlans={subPlans}
          contributions={contributions}
          embedded
          onChanged={handleChanged}
          onClose={onClose}
          onNavigatePlan={setActivePlanId}
        />
      )}
    </Modal>
  );
}
