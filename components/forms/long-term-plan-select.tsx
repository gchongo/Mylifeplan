"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

function sortPlans(plans: PlanOption[]): PlanOption[] {
  return [...plans].sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
}

export function PlanContributionSelect({
  value,
  onChange,
  refreshKey = 0,
}: {
  value?: string | null;
  onChange?: (id: string | null) => void;
  refreshKey?: number;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadPlans = useCallback(() => {
    setLoading(true);
    setLoadError("");

    fetch("/api/plans")
      .then((r) => {
        if (!r.ok) throw new Error("加载失败");
        return r.json();
      })
      .then((data) => {
        const plans: PlanOption[] = data.plans ?? [];
        setOptions(
          sortPlans(plans).map((p) => ({
            value: p.id,
            label: formatPlanLabel(p),
          })),
        );
      })
      .catch(() => setLoadError("无法加载计划列表"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans, refreshKey]);

  return (
    <div className="w-full">
      <Select
        label="关联计划（可选）"
        options={[{ value: "", label: "不关联计划" }, ...options]}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value || null)}
        onFocus={loadPlans}
        disabled={loading && options.length === 0}
        placeholder={loading && options.length === 0 ? "加载计划…" : undefined}
      />
      {!loading && !loadError && options.length === 0 && (
        <p className="mt-1.5 text-xs text-gray-500">
          暂无计划。
          <Link href="/plans" className="ml-1 text-brand-600 hover:underline">
            去创建计划 →
          </Link>
        </p>
      )}
      {loadError && <p className="mt-1.5 text-xs text-red-500">{loadError}</p>}
    </div>
  );
}

/** @deprecated Use PlanContributionSelect */
export const LongTermPlanSelect = PlanContributionSelect;
