"use client";

import { useEffect, useState } from "react";
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
  label = "父计划（可选）",
  emptyLabel = "无父计划",
}: {
  value?: string | null;
  onChange?: (id: string | null) => void;
  excludePlanId?: string;
  name?: string;
  label?: string;
  emptyLabel?: string;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        const plans: PlanOption[] = (data.plans ?? []).filter(
          (p: PlanOption & { id: string }) => p.id !== excludePlanId,
        );
        setOptions([
          { value: "", label: emptyLabel },
          ...plans.map((p) => ({
            value: p.id,
            label: formatPlanLabel(p),
          })),
        ]);
      })
      .finally(() => setLoading(false));
  }, [excludePlanId, emptyLabel]);

  return (
    <Select
      name={name}
      label={label}
      options={options}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value || null)}
      placeholder={loading ? "加载中…" : emptyLabel}
      disabled={loading}
    />
  );
}
