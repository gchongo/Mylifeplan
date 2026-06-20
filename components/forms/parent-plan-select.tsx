"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui";

interface PlanOption {
  id: string;
  title: string;
  type: string;
}

export function ParentPlanSelect({
  planType,
  value,
  onChange,
  name = "parentPlanId",
}: {
  planType: string;
  value?: string | null;
  onChange?: (id: string | null) => void;
  name?: string;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const required = planType === "phase";

  useEffect(() => {
    if (planType === "goal") {
      setOptions([]);
      setLoading(false);
      return;
    }

    const parentType = planType === "phase" ? "goal" : "phase";
    setLoading(true);
    fetch(`/api/plans?type=${parentType}`)
      .then((r) => r.json())
      .then((data) => {
        const plans: PlanOption[] = data.plans ?? [];
        const opts = plans.map((p) => ({
          value: p.id,
          label: `${p.title} (${p.type})`,
        }));
        if (!required) {
          opts.unshift({ value: "", label: "无父计划" });
        }
        setOptions(opts);
      })
      .finally(() => setLoading(false));
  }, [planType, required]);

  if (planType === "goal") return null;

  const placeholder = loading
    ? "加载中…"
    : required
      ? "请选择父计划（必填）"
      : "无父计划（可选）";

  return (
    <Select
      name={name}
      label={planType === "phase" ? "所属长期目标" : "所属阶段计划（可选）"}
      options={options}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value || null)}
      placeholder={placeholder}
      disabled={loading}
    />
  );
}
