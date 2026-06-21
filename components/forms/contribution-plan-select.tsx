"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "@/components/ui";
import {
  collectPlanSubtreeIds,
  findRootPlanId,
} from "@/lib/gantt-contribution-display";

interface PlanOption {
  id: string;
  title: string;
  parentPlanId?: string | null;
  parentTitle?: string | null;
}

function formatPlanLabel(p: PlanOption, planTitleById: Map<string, string>): string {
  if (!p.parentPlanId) return p.title;
  const parentTitle = p.parentTitle ?? planTitleById.get(p.parentPlanId) ?? "父计划";
  return `${parentTitle} › ${p.title}`;
}

/** 贡献改绑：仅限当前计划所在一级计划子树内的计划 */
export function ContributionPlanSelect({
  currentPlanId,
  value,
  onChange,
}: {
  currentPlanId: string;
  value: string;
  onChange: (planId: string) => void;
}) {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans ?? []))
      .finally(() => setLoading(false));
  }, []);

  const options = useMemo(() => {
    if (plans.length === 0) return [];
    const nodes = plans.map((p) => ({
      id: p.id,
      parentId: p.parentPlanId ?? null,
    }));
    const byId = new Map(nodes.map((p) => [p.id, p]));
    const rootId = findRootPlanId(currentPlanId, byId);
    const allowed = collectPlanSubtreeIds(rootId, nodes);
    const titleById = new Map(plans.map((p) => [p.id, p.title]));
    return plans
      .filter((p) => allowed.has(p.id))
      .map((p) => ({
        value: p.id,
        label: formatPlanLabel(p, titleById),
      }));
  }, [plans, currentPlanId]);

  return (
    <Select
      label="所属计划"
      options={options}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={loading ? "加载中…" : "选择子计划"}
      disabled={loading || options.length === 0}
    />
  );
}
