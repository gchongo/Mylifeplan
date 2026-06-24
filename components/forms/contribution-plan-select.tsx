"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
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

function formatPlanLabel(
  p: PlanOption,
  planTitleById: Map<string, string>,
  parentFallback: string,
): string {
  if (!p.parentPlanId) return p.title;
  const parentTitle = p.parentTitle ?? planTitleById.get(p.parentPlanId) ?? parentFallback;
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
  const { t } = useI18n();
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
        label: formatPlanLabel(p, titleById, t("common.parentPlanFallback")),
      }));
  }, [plans, currentPlanId, t]);

  return (
    <Select
      label={t("forms.belongsToPlan")}
      options={options}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={loading ? t("common.loading") : t("forms.selectSubPlan")}
      disabled={loading || options.length === 0}
    />
  );
}
