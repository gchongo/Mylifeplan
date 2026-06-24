"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ParentPlanSelect } from "@/components/forms/parent-plan-select";
import { PlanContributionSelect } from "@/components/forms/long-term-plan-select";
import {
  FeedComposeCard,
  type FeedComposeValues,
} from "@/components/feed/feed-compose-card";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { ContributionMarkerColorField } from "@/components/contributions/contribution-marker-color-field";
import { PlanColorSwatchField } from "@/components/forms/plan-color-swatch-field";
import { apiJson } from "@/lib/client-api";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { nowDatetimeLocal } from "@/lib/dates";
import { DEFAULT_PLAN_COLOR } from "@/lib/plan-color";
import { cn } from "@/lib/utils";

export type PlanContributionComposeMode = "plan" | "contribution";

function emptyCompose(startAt = ""): FeedComposeValues {
  return { title: "", body: "", startAt, endAt: startAt, imageUrls: [] };
}

function defaultStartForMode(value: string | null | undefined): string {
  if (!value) return nowDatetimeLocal();
  return value.includes("T") ? value.slice(0, 16) : `${value}T09:00`;
}

export function PlanContributionComposeForm({
  formKey,
  defaultMode = "plan",
  fixedParentPlanId,
  fixedPlanId,
  defaultStartAt,
  defaultEndAt,
  allowModeSwitch = true,
  onSuccess,
  onCancel,
  submitLabel,
}: {
  formKey: string;
  defaultMode?: PlanContributionComposeMode;
  fixedParentPlanId?: string | null;
  fixedPlanId?: string | null;
  defaultStartAt?: string | null;
  defaultEndAt?: string | null;
  allowModeSwitch?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const { t } = useI18n();
  const modes: { id: PlanContributionComposeMode; label: string }[] = [
    { id: "plan", label: t("feed.typeFilter.plan") },
    { id: "contribution", label: t("feed.typeFilter.contribution") },
  ];
  const [mode, setMode] = useState<PlanContributionComposeMode>(defaultMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [planValues, setPlanValues] = useState<FeedComposeValues>(() => emptyCompose(nowDatetimeLocal()));
  const [planRelatedId, setPlanRelatedId] = useState<string | null>(null);
  const [contributionValues, setContributionValues] = useState<FeedComposeValues>(() =>
    emptyCompose(nowDatetimeLocal()),
  );
  const [contributionRelatedId, setContributionRelatedId] = useState<string | null>(null);
  const [contributionMarkerColor, setContributionMarkerColor] = useState<string | null>(null);
  const [planColor, setPlanColor] = useState(DEFAULT_PLAN_COLOR);
  const [planListRefreshKey, setPlanListRefreshKey] = useState(0);
  const resolvedSubmitLabel = submitLabel ?? t("common.save");

  useEffect(() => {
    setMode(defaultMode);
    setError("");
    const planStart = defaultStartForMode(defaultStartAt);
    const planEnd = defaultEndAt ? defaultStartForMode(defaultEndAt) : planStart;
    const contribStart = defaultStartForMode(defaultStartAt);
    const contribEnd = defaultEndAt ? defaultStartForMode(defaultEndAt) : contribStart;
    setPlanValues({ ...emptyCompose(planStart), startAt: planStart, endAt: planEnd });
    setContributionValues({
      ...emptyCompose(contribStart),
      startAt: contribStart,
      endAt: contribEnd,
    });
    setPlanRelatedId(fixedParentPlanId ?? null);
    setContributionRelatedId(fixedPlanId ?? fixedParentPlanId ?? null);
    setContributionMarkerColor(null);
    setPlanColor(DEFAULT_PLAN_COLOR);
  }, [
    formKey,
    defaultMode,
    fixedParentPlanId,
    fixedPlanId,
    defaultStartAt,
    defaultEndAt,
  ]);

  const canSubmit =
    !busy &&
    (mode === "plan"
      ? planValues.title.trim().length > 0
      : contributionValues.title.trim().length > 0 &&
        !!contributionValues.startAt &&
        !!contributionRelatedId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "contribution") {
        const title = contributionValues.title.trim();
        if (!title) {
          setError(t("forms.errorTitle"));
          return;
        }
        if (!contributionValues.startAt) {
          setError(t("forms.errorTime"));
          return;
        }
        if (!contributionRelatedId) {
          setError(t("forms.errorRelatedPlan"));
          return;
        }
        await apiJson("/api/contributions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: contributionRelatedId,
            title,
            body: contributionValues.body.trim() || null,
            imageUrls: contributionValues.imageUrls.length
              ? contributionValues.imageUrls
              : undefined,
            occurredOn: contributionValues.startAt,
            occurredEndOn:
              contributionValues.endAt &&
              contributionValues.endAt !== contributionValues.startAt
                ? contributionValues.endAt
                : null,
            markerColor: contributionMarkerColor,
          }),
        });
      } else {
        const title = planValues.title.trim();
        if (!title) {
          setError(t("forms.errorTitle"));
          return;
        }
        await apiJson("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: planValues.body.trim() || null,
            type: "goal",
            parentPlanId: planRelatedId,
            startDate: planValues.startAt || null,
            endDate: planValues.endAt || null,
            color: planColor,
          }),
        });
        setPlanListRefreshKey((k) => k + 1);
      }

      dispatchPlanUpdated();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  const relatedPlanSelect = (variant: PlanContributionComposeMode) =>
    variant === "plan" ? (
      <ParentPlanSelect
        value={planRelatedId}
        onChange={setPlanRelatedId}
        label={t("forms.parentPlan")}
        emptyLabel={t("forms.noParentPlan")}
      />
    ) : (
      <PlanContributionSelect
        value={contributionRelatedId}
        onChange={setContributionRelatedId}
        refreshKey={planListRefreshKey}
        required
        label={t("forms.relatedPlan")}
      />
    );

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      {allowModeSwitch && (
        <div className="flex flex-wrap items-center gap-1">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                setError("");
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                mode === m.id
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {mode === "plan" ? (
        <>
          <FeedComposeCard
            values={planValues}
            onChange={(patch) => setPlanValues((prev) => ({ ...prev, ...patch }))}
            timeKind="datetime"
            titlePlaceholder={t("forms.planTitle")}
            bodyPlaceholder={t("forms.descriptionDetails")}
            relatedPlan={relatedPlanSelect("plan")}
          />
          <PlanColorSwatchField value={planColor} onChange={setPlanColor} disabled={busy} />
        </>
      ) : (
        <>
          <FeedComposeCard
            values={contributionValues}
            onChange={(patch) => setContributionValues((prev) => ({ ...prev, ...patch }))}
            timeKind="datetime"
            startRequired
            titlePlaceholder={t("forms.contributionTitle")}
            bodyPlaceholder={t("forms.details")}
            showImages
            relatedPlan={relatedPlanSelect("contribution")}
          />
          <ContributionMarkerColorField
            value={contributionMarkerColor}
            onChange={setContributionMarkerColor}
            disabled={busy}
          />
        </>
      )}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={!canSubmit}>
          {busy ? t("common.saving") : resolvedSubmitLabel}
        </Button>
      </div>
    </form>
  );
}
