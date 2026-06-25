"use client";

import { useState } from "react";
import { ParentPlanSelect } from "@/components/forms/parent-plan-select";
import { PlanContributionSelect } from "@/components/forms/long-term-plan-select";
import {
  FeedComposeCard,
  type FeedComposeValues,
} from "@/components/feed/feed-compose-card";
import { ContributionMarkerColorField } from "@/components/contributions/contribution-marker-color-field";
import { PlanColorSwatchField } from "@/components/forms/plan-color-swatch-field";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { apiJson } from "@/lib/client-api";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { dispatchMemoUpdated } from "@/lib/memo-events";
import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";
import { cn } from "@/lib/utils";
import { nowDatetimeLocal } from "@/lib/dates";
import { DEFAULT_PLAN_COLOR } from "@/lib/plan-color";
import { MEMO_QUADRANT_IDS, type MemoQuadrantId } from "@/lib/memo-quadrant";
import { localizeMemoQuadrantOption } from "@/lib/i18n/feed-helpers";

type ComposerMode = "memo" | "plan" | "contribution";

const MODES: ComposerMode[] = ["memo", "plan", "contribution"];

function emptyCompose(startAt = ""): FeedComposeValues {
  return { title: "", body: "", startAt, endAt: startAt, imageUrls: [] };
}

export function FeedComposer({ onPublished }: { onPublished: () => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<ComposerMode>("memo");
  const [memoText, setMemoText] = useState("");
  const [memoQuadrant, setMemoQuadrant] = useState<MemoQuadrantId>("not_urgent_important");
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

  const canPublish =
    !busy &&
    (mode === "memo"
      ? memoText.trim().length > 0
      : mode === "plan"
        ? planValues.title.trim().length > 0
        : contributionValues.title.trim().length > 0 &&
          !!contributionValues.startAt &&
          !!contributionRelatedId);

  function resetForm() {
    setMemoText("");
    setMemoQuadrant("not_urgent_important");
    setPlanValues(emptyCompose(nowDatetimeLocal()));
    setPlanRelatedId(null);
    setContributionValues(emptyCompose(nowDatetimeLocal()));
    setContributionRelatedId(null);
    setContributionMarkerColor(null);
    setPlanColor(DEFAULT_PLAN_COLOR);
    setPlanListRefreshKey((k) => k + 1);
  }

  async function handlePublish() {
    setBusy(true);
    setError("");
    try {
      if (mode === "contribution") {
        const title = contributionValues.title.trim();
        if (!title) {
          setError(t("feed.composer.errorTitle"));
          return;
        }
        if (!contributionValues.startAt) {
          setError(t("feed.composer.errorTime"));
          return;
        }
        if (!contributionRelatedId) {
          setError(t("feed.composer.errorRelatedPlan"));
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
              contributionValues.endAt && contributionValues.endAt !== contributionValues.startAt
                ? contributionValues.endAt
                : null,
            markerColor: contributionMarkerColor,
          }),
        });
        dispatchPlanUpdated();
      } else if (mode === "plan") {
        const title = planValues.title.trim();
        if (!title) {
          setError(t("feed.composer.errorTitle"));
          return;
        }
        const created = await apiJson<{ plan?: SerializedPlanForGantt }>("/api/plans", {
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
        dispatchPlanUpdated({ plan: created.plan });
      } else {
        const content = memoText.trim();
        if (!content) return;
        await apiJson("/api/memos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, quadrant: memoQuadrant }),
        });
        dispatchMemoUpdated();
      }

      resetForm();
      onPublished();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("feed.composer.publishFailed"));
    } finally {
      setBusy(false);
    }
  }

  const relatedPlanSelect = (variant: "plan" | "contribution") =>
    variant === "plan" ? (
      <ParentPlanSelect
        value={planRelatedId}
        onChange={setPlanRelatedId}
        label={t("feed.composer.parentPlan")}
        emptyLabel={t("feed.composer.noParentPlan")}
      />
    ) : (
      <PlanContributionSelect
        value={contributionRelatedId}
        onChange={setContributionRelatedId}
        refreshKey={planListRefreshKey}
        required
        label={t("feed.composer.relatedPlan")}
      />
    );

  return (
    <div className="feed-composer shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-1">
          {MODES.map((modeId) => (
            <button
              key={modeId}
              type="button"
              onClick={() => {
                setMode(modeId);
                setError("");
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                mode === modeId
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
              )}
            >
              {t(`feed.typeFilter.${modeId}`)}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {error && <span className="max-w-[10rem] truncate text-xs text-red-500">{error}</span>}
          <Button type="button" size="sm" disabled={!canPublish} onClick={handlePublish}>
            {busy ? t("feed.composer.publishing") : t("feed.composer.publish")}
          </Button>
        </div>
      </div>

      <div className="p-3">
        {mode === "plan" && (
          <div className="space-y-3">
            <FeedComposeCard
              values={planValues}
              onChange={(patch) => setPlanValues((prev) => ({ ...prev, ...patch }))}
              timeKind="datetime"
              titlePlaceholder={t("feed.composer.planTitlePlaceholder")}
              bodyPlaceholder={t("feed.composer.planBodyPlaceholder")}
              relatedPlan={relatedPlanSelect("plan")}
            />
            <PlanColorSwatchField value={planColor} onChange={setPlanColor} disabled={busy} />
          </div>
        )}

        {mode === "contribution" && (
          <div className="space-y-3">
            <FeedComposeCard
              values={contributionValues}
              onChange={(patch) => setContributionValues((prev) => ({ ...prev, ...patch }))}
              timeKind="datetime"
              startRequired
              titlePlaceholder={t("feed.composer.contributionTitlePlaceholder")}
              bodyPlaceholder={t("feed.composer.contributionBodyPlaceholder")}
              showImages
              relatedPlan={relatedPlanSelect("contribution")}
            />
            <ContributionMarkerColorField
              value={contributionMarkerColor}
              onChange={setContributionMarkerColor}
              disabled={busy}
            />
          </div>
        )}

        {mode === "memo" && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="shrink-0">{t("feed.composer.memoType")}</span>
              <select
                value={memoQuadrant}
                onChange={(e) => setMemoQuadrant(e.target.value as MemoQuadrantId)}
                className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                aria-label={t("feed.composer.memoTypeAria")}
              >
                {MEMO_QUADRANT_IDS.map((quadrantId) => {
                  const option = localizeMemoQuadrantOption(t, quadrantId);
                  return (
                    <option key={quadrantId} value={quadrantId} title={option.hint}>
                      {option.shortLabel} {option.label}
                    </option>
                  );
                })}
              </select>
            </label>
            <textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder={t("feed.composer.memoPlaceholder")}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-200 bg-transparent px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-gray-100"
            />
          </div>
        )}
      </div>
    </div>
  );
}
