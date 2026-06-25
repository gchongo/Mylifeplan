"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { PLAN_UPDATED_EVENT } from "@/lib/plan-events";
import { Select } from "@/components/ui";

interface PlanOption {
  id: string;
  title: string;
  parentTitle?: string | null;
}

function formatPlanLabel(p: PlanOption): string {
  if (p.parentTitle) return `${p.parentTitle} › ${p.title}`;
  return p.title;
}

export function ParentPlanSelect({
  value,
  onChange,
  excludePlanId,
  name = "parentPlanId",
  label,
  emptyLabel,
}: {
  value?: string | null;
  onChange?: (id: string | null) => void;
  excludePlanId?: string;
  name?: string;
  label?: string;
  emptyLabel?: string;
}) {
  const { t } = useI18n();
  const resolvedLabel = label ?? t("forms.parentPlan");
  const resolvedEmptyLabel = emptyLabel ?? t("forms.noParentPlan");
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    function onPlanUpdated() {
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
    return () => window.removeEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        const plans: PlanOption[] = (data.plans ?? []).filter(
          (p: PlanOption & { id: string }) => p.id !== excludePlanId,
        );
        setOptions([
          { value: "", label: resolvedEmptyLabel },
          ...plans.map((p) => ({
            value: p.id,
            label: formatPlanLabel(p),
          })),
        ]);
      })
      .finally(() => setLoading(false));
  }, [excludePlanId, resolvedEmptyLabel, refreshKey]);

  return (
    <Select
      name={name}
      label={resolvedLabel}
      options={options}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value || null)}
      placeholder={loading ? t("common.loading") : resolvedEmptyLabel}
      disabled={loading}
    />
  );
}
