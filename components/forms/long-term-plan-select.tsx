"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Select } from "@/components/ui";
import { ApiError, apiJson } from "@/lib/client-api";

interface PlanOption {
  id: string;
  title: string;
  parentTitle?: string | null;
}

function formatPlanLabel(p: PlanOption): string {
  if (p.parentTitle) return `${p.parentTitle} › ${p.title}`;
  return p.title;
}

function sortPlans(plans: PlanOption[], locale: string): PlanOption[] {
  return [...plans].sort((a, b) => a.title.localeCompare(b.title, locale));
}

export function PlanContributionSelect({
  value,
  onChange,
  refreshKey = 0,
  inline = false,
  required = false,
  label,
}: {
  value?: string | null;
  onChange?: (id: string | null) => void;
  refreshKey?: number;
  /** 与贡献日期等同排展示 */
  inline?: boolean;
  required?: boolean;
  label?: string;
}) {
  const { t, locale } = useI18n();
  const resolvedLabel = label ?? t("forms.relatedPlan");
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadPlans = useCallback(() => {
    setLoading(true);
    setLoadError("");

    apiJson<{ plans?: PlanOption[] }>("/api/plans")
      .then((data) => {
        const plans: PlanOption[] = data.plans ?? [];
        setOptions(
          sortPlans(plans, locale).map((p) => ({
            value: p.id,
            label: formatPlanLabel(p),
          })),
        );
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setLoadError(t("forms.sessionExpired"));
          return;
        }
        setLoadError(t("forms.loadPlansFailed"));
      })
      .finally(() => setLoading(false));
  }, [locale, t]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans, refreshKey]);

  return (
    <div className="w-full min-w-0">
      <Select
        label={inline ? undefined : resolvedLabel}
        requiredMark={required && !inline}
        aria-label={inline ? resolvedLabel : undefined}
        options={[
          ...(required ? [] : [{ value: "", label: t("forms.noRelatedPlan") }]),
          ...options,
        ]}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value || null)}
        onFocus={loadPlans}
        disabled={loading && options.length === 0}
        placeholder={loading && options.length === 0 ? t("forms.loadingPlans") : undefined}
      />
      {!loading && !loadError && options.length === 0 && (
        <p className="mt-1.5 text-xs text-gray-500">
          {t("forms.noPlans")}
          <Link href="/plans" className="ml-1 text-brand-600 hover:underline">
            {t("forms.createPlanLink")}
          </Link>
        </p>
      )}
      {loadError && <p className="mt-1.5 text-xs text-red-500">{loadError}</p>}
    </div>
  );
}

/** @deprecated Use PlanContributionSelect */
export const LongTermPlanSelect = PlanContributionSelect;
