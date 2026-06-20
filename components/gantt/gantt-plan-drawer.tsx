"use client";

import { useEffect, useState } from "react";
import { DrawerLayout, DrawerPanel } from "@/components/ui/drawer";
import { Loading } from "@/components/ui/feedback";
import { PlanDetailClient } from "@/components/plans/plan-detail-client";
import type { PlanFormValues } from "@/components/forms/plan-form";

interface PlanPayload extends PlanFormValues {
  id: string;
}

export function GanttPlanDrawer({
  planId,
  open,
  onClose,
  children,
}: {
  planId: string | null;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [subPlans, setSubPlans] = useState<
    { id: string; title: string; type: string; status: string }[]
  >([]);
  const [tasks, setTasks] = useState<
    { id: string; title: string; status: string; startDate: string | null; dueDate: string | null }[]
  >([]);

  useEffect(() => {
    if (!open || !planId) {
      setPlan(null);
      setSubPlans([]);
      setTasks([]);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`/api/plans/${planId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.plan) {
          setError("计划不存在");
          setPlan(null);
          return;
        }
        setPlan(data.plan);
        setSubPlans(data.plan.subPlans ?? []);
        setTasks(data.plan.tasks ?? []);
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
  }, [open, planId]);

  return (
    <DrawerLayout
      open={open}
      onClose={onClose}
      panel={
        <DrawerPanel title={plan?.title ?? "计划详情"} onClose={onClose} className="p-0">
          {loading && <Loading label="加载计划…" />}
          {!loading && error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
          {!loading && plan && (
            <div className="p-4">
              <PlanDetailClient plan={plan} subPlans={subPlans} tasks={tasks} />
            </div>
          )}
        </DrawerPanel>
      }
    >
      {children}
    </DrawerLayout>
  );
}
