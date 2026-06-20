"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui";

interface PlanOption {
  id: string;
  title: string;
  type: string;
}

export function PlanSelect({
  value,
  onChange,
  name = "planId",
}: {
  value?: string | null;
  onChange?: (id: string | null) => void;
  name?: string;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        const plans: PlanOption[] = data.plans ?? [];
        setOptions(
          plans.map((p) => ({
            value: p.id,
            label: p.title,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Select
      name={name}
      label="关联计划（可选）"
      options={[{ value: "", label: "不关联计划" }, ...options]}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value || null)}
      disabled={loading}
    />
  );
}
