"use client";

import { useEffect, useState } from "react";
import { DrawerPanel } from "@/components/ui/drawer";
import { Loading } from "@/components/ui/feedback";
import { PlanDetailClient } from "@/components/plans/plan-detail-client";
import type { PlanFormValues } from "@/components/forms/plan-form";
import type { PlanContributionItem } from "@/components/plans/plan-contribution-timeline";
import { isSubPlanOverdueAgainstParent, planOverdueNode } from "@/lib/gantt-plan-status";

interface PlanPayload extends PlanFormValues {
  id: string;
}

export function GanttPlanDrawerPanel({
  planId,
  onClose,
}: {
  planId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [subPlans, setSubPlans] = useState<
    { id: string; title: string; status: string; overdue?: boolean }[]
  >([]);
  const [contributions, setContributions] = useState<PlanContributionItem[]>([]);

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
        const parentNode = planOverdueNode(planData.plan);
        setSubPlans(
          (planData.plan.subPlans ?? []).map(
            (sp: { id: string; title: string; status: string; startDate?: string | null; endDate?: string | null }) => ({
              id: sp.id,
              title: sp.title,
              status: sp.status,
              overdue: isSubPlanOverdueAgainstParent(planOverdueNode(sp), parentNode),
            }),
          ),
        );
        setContributions(contribData.contributions ?? []);
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPlan(planId);
  }, [planId]);

  return (
    <DrawerPanel title={plan?.title ?? "计划详情"} onClose={onClose} className="p-0">
      {loading && <Loading label="加载计划…" />}
      {!loading && error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
      {!loading && plan && (
        <div className="p-4">
          <PlanDetailClient
            plan={plan}
            subPlans={subPlans}
            contributions={contributions}
            embedded
            onChanged={() => loadPlan(planId)}
          />
        </div>
      )}
    </DrawerPanel>
  );
}
