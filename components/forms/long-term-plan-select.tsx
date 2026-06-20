"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui";

interface PlanOption {
  id: string;
  title: string;
  type: string;
}

export function LongTermPlanSelect({
  value,
  onChange,
}: {
  value?: string | null;
  onChange?: (id: string | null) => void;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        const plans: PlanOption[] = (data.plans ?? []).filter(
          (p: PlanOption) => p.type === "goal" || p.type === "phase",
        );
        setOptions(
          plans.map((p) => ({
            value: p.id,
            label: `${p.title} (${p.type === "goal" ? "长期" : "阶段"})`,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Select
      label="关联长期计划（可选）"
      options={[{ value: "", label: "不关联长期计划" }, ...options]}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value || null)}
      disabled={loading}
    />
  );
}
