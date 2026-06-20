"use client";

import { useEffect, useState } from "react";
import { DrawerPanel } from "@/components/ui/drawer";
import { Loading } from "@/components/ui/feedback";
import { PlanDetailClient } from "@/components/plans/plan-detail-client";
import type { PlanFormValues } from "@/components/forms/plan-form";

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
    { id: string; title: string; status: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setPlan(null);
    setSubPlans([]);

    fetch(`/api/plans/${planId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.plan) {
          setError("计划不存在");
          return;
        }
        setPlan(data.plan);
        setSubPlans(
          (data.plan.subPlans ?? []).map(
            (sp: { id: string; title: string; status: string }) => ({
              id: sp.id,
              title: sp.title,
              status: sp.status,
            }),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setError("加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [planId]);

  return (
    <DrawerPanel title={plan?.title ?? "计划详情"} onClose={onClose} className="p-0">
      {loading && <Loading label="加载计划…" />}
      {!loading && error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
      {!loading && plan && (
        <div className="p-4">
          <PlanDetailClient plan={plan} subPlans={subPlans} />
        </div>
      )}
    </DrawerPanel>
  );
}
