"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui";

const TYPE_LABELS: Record<string, string> = {
  goal: "长期",
  phase: "阶段",
  weekly: "周计划",
  daily: "日计划",
};

interface PlanOption {
  id: string;
  title: string;
  type: string;
  parentTitle?: string | null;
}

function formatPlanLabel(p: PlanOption): string {
  const tag = TYPE_LABELS[p.type] ?? p.type;
  if (p.type === "phase" && p.parentTitle) {
    return `${p.parentTitle} › ${p.title}（${tag}）`;
  }
  return `${p.title}（${tag}）`;
}

export function PlanContributionSelect({
  value,
  onChange,
}: {
  value?: string | null;
  onChange?: (id: string | null) => void;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("/api/plans?for=contribution")
      .then((r) => {
        if (!r.ok) throw new Error("加载失败");
        return r.json();
      })
      .then((data) => {
        const plans: PlanOption[] = data.plans ?? [];
        setOptions(
          plans.map((p) => ({
            value: p.id,
            label: formatPlanLabel(p),
          })),
        );
      })
      .catch(() => setLoadError("无法加载计划列表"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full">
      <Select
        label="关联计划（可选）"
        options={[{ value: "", label: "不关联计划" }, ...options]}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value || null)}
        disabled={loading}
        placeholder={loading ? "加载计划…" : undefined}
      />
      {!loading && !loadError && options.length === 0 && (
        <p className="mt-1.5 text-xs text-gray-500">
          暂无计划。
          <Link href="/plans/long" className="ml-1 text-brand-600 hover:underline">
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
