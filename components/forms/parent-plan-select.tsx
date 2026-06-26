"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Select } from "@/components/ui";
import { apiJson } from "@/lib/client-api";
import { queryKeys } from "@/lib/query/keys";

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

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.plans.list(),
    queryFn: () => apiJson<{ plans?: PlanOption[] }>("/api/plans"),
  });

  const options = [
    { value: "", label: resolvedEmptyLabel },
    ...(data?.plans ?? [])
      .filter((p) => p.id !== excludePlanId)
      .map((p) => ({
        value: p.id,
        label: formatPlanLabel(p),
      })),
  ];

  return (
    <Select
      name={name}
      label={resolvedLabel}
      options={options}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value || null)}
      placeholder={isLoading ? t("common.loading") : resolvedEmptyLabel}
      disabled={isLoading}
    />
  );
}
