"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { PlanContributionComposeModal } from "@/components/forms/plan-contribution-compose-modal";
import type { PlanContributionComposeMode } from "@/components/forms/plan-contribution-compose-form";
import type { CalendarItem } from "@/types";

export function CalendarDayCreateActions({
  dateStr,
  dayItems,
  onSuccess,
}: {
  dateStr: string;
  dayItems: CalendarItem[];
  onSuccess: () => void;
}) {
  const { t } = useI18n();
  const [planId, setPlanId] = useState("");
  const [planOptions, setPlanOptions] = useState<{ id: string; title: string }[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<PlanContributionComposeMode>("contribution");

  useEffect(() => {
    if (dayItems.length > 0) {
      setPlanOptions(dayItems.map((i) => ({ id: i.id, title: i.title })));
      setPlanId(dayItems[0]!.id);
      return;
    }

    let cancelled = false;
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const plans = (data.plans ?? []) as { id: string; title: string }[];
        setPlanOptions(plans);
        setPlanId(plans[0]?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) {
          setPlanOptions([]);
          setPlanId("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dayItems, dateStr]);

  if (planOptions.length === 0) {
    return (
      <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
        {t("calendar.create.noPlans")}
      </p>
    );
  }

  function openCompose(mode: PlanContributionComposeMode) {
    setComposeMode(mode);
    setComposeOpen(true);
  }

  return (
    <>
      <div className="space-y-2 border-t border-gray-100 px-4 py-3">
        <label className="block text-xs font-medium text-gray-500">{t("calendar.create.relatedPlan")}</label>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {planOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!planId}
            onClick={() => openCompose("contribution")}
          >
            {t("calendar.create.addContribution")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!planId}
            onClick={() => openCompose("plan")}
          >
            {t("calendar.create.addSubPlan")}
          </Button>
        </div>
      </div>

      {planId && (
        <PlanContributionComposeModal
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          title={t("calendar.create.addPlanOrContribution")}
          defaultMode={composeMode}
          fixedParentPlanId={planId}
          fixedPlanId={planId}
          defaultStartAt={dateStr}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
