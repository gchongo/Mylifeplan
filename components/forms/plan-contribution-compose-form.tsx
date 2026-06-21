"use client";

import { useEffect, useState } from "react";
import { ParentPlanSelect } from "@/components/forms/parent-plan-select";
import { PlanContributionSelect } from "@/components/forms/long-term-plan-select";
import {
  FeedComposeCard,
  type FeedComposeValues,
} from "@/components/feed/feed-compose-card";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { apiJson } from "@/lib/client-api";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type PlanContributionComposeMode = "plan" | "contribution";

const MODES: { id: PlanContributionComposeMode; label: string; hint: string }[] = [
  { id: "plan", label: "计划", hint: "标题必填；补充时间后可出现在甘特图与日历" },
  { id: "contribution", label: "贡献", hint: "记录计划进展，标题与日期必填" },
];

function emptyCompose(startAt = ""): FeedComposeValues {
  return { title: "", body: "", startAt, endAt: startAt, imageUrls: [] };
}

function defaultStartForMode(
  value: string | null | undefined,
  mode: PlanContributionComposeMode,
): string {
  if (!value) return mode === "contribution" ? todayStr() : "";
  if (mode === "contribution") return value.slice(0, 10);
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
  submitLabel = "保存",
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
  const [mode, setMode] = useState<PlanContributionComposeMode>(defaultMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [planValues, setPlanValues] = useState<FeedComposeValues>(() => emptyCompose());
  const [planRelatedId, setPlanRelatedId] = useState<string | null>(null);
  const [contributionValues, setContributionValues] = useState<FeedComposeValues>(() =>
    emptyCompose(todayStr()),
  );
  const [contributionRelatedId, setContributionRelatedId] = useState<string | null>(null);
  const [planListRefreshKey, setPlanListRefreshKey] = useState(0);

  useEffect(() => {
    setMode(defaultMode);
    setError("");
    const planStart = defaultStartForMode(defaultStartAt, "plan");
    const planEnd = defaultEndAt
      ? defaultStartForMode(defaultEndAt, "plan")
      : planStart;
    const contribStart = defaultStartForMode(defaultStartAt, "contribution");
    const contribEnd = defaultEndAt
      ? defaultStartForMode(defaultEndAt, "contribution")
      : contribStart;
    setPlanValues({ ...emptyCompose(planStart), startAt: planStart, endAt: planEnd });
    setContributionValues({ ...emptyCompose(contribStart), startAt: contribStart, endAt: contribEnd });
    setPlanRelatedId(fixedParentPlanId ?? null);
    setContributionRelatedId(fixedPlanId ?? fixedParentPlanId ?? null);
  }, [
    formKey,
    defaultMode,
    fixedParentPlanId,
    fixedPlanId,
    defaultStartAt,
    defaultEndAt,
  ]);

  const effectiveParentId = fixedParentPlanId ?? planRelatedId;
  const effectiveContributionPlanId = fixedPlanId ?? contributionRelatedId;

  const canSubmit =
    !busy &&
    (mode === "plan"
      ? planValues.title.trim().length > 0
      : contributionValues.title.trim().length > 0 &&
        !!contributionValues.startAt &&
        !!effectiveContributionPlanId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "contribution") {
        const title = contributionValues.title.trim();
        if (!title) {
          setError("请填写标题");
          return;
        }
        if (!contributionValues.startAt) {
          setError("请选择贡献日期");
          return;
        }
        if (!effectiveContributionPlanId) {
          setError("请选择关联计划");
          return;
        }
        await apiJson("/api/contributions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: effectiveContributionPlanId,
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
          }),
        });
      } else {
        const title = planValues.title.trim();
        if (!title) {
          setError("请填写标题");
          return;
        }
        await apiJson("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: planValues.body.trim() || null,
            type: "goal",
            parentPlanId: effectiveParentId,
            startDate: planValues.startAt || null,
            endDate: planValues.endAt || null,
          }),
        });
        setPlanListRefreshKey((k) => k + 1);
      }

      dispatchPlanUpdated();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  const activeHint = MODES.find((m) => m.id === mode)?.hint ?? "";

  const relatedPlanSelect = (variant: PlanContributionComposeMode) =>
    variant === "plan" ? (
      fixedParentPlanId ? (
        <p className="text-sm text-gray-500">将作为所选父计划的子计划创建</p>
      ) : (
        <ParentPlanSelect
          value={planRelatedId}
          onChange={setPlanRelatedId}
          label="父计划（可选）"
          emptyLabel="无父计划"
        />
      )
    ) : fixedPlanId ? (
      <p className="text-sm text-gray-500">将关联到当前计划</p>
    ) : (
      <PlanContributionSelect
        value={contributionRelatedId}
        onChange={setContributionRelatedId}
        refreshKey={planListRefreshKey}
      />
    );

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      {allowModeSwitch && (
        <div className="flex flex-wrap items-center gap-1">
          {MODES.map((m) => (
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

      <p className="text-xs text-gray-400">{activeHint}</p>
      {error && <ErrorMessage message={error} />}

      {mode === "plan" ? (
        <FeedComposeCard
          values={planValues}
          onChange={(patch) => setPlanValues((prev) => ({ ...prev, ...patch }))}
          timeKind="datetime"
          titlePlaceholder="输入计划标题"
          bodyPlaceholder="计划描述与细节，支持 Markdown。（可选）"
          relatedPlan={relatedPlanSelect("plan")}
        />
      ) : (
        <FeedComposeCard
          values={contributionValues}
          onChange={(patch) => setContributionValues((prev) => ({ ...prev, ...patch }))}
          timeKind="date"
          startRequired
          titlePlaceholder="输入标题，简要说明本次贡献"
          bodyPlaceholder="在此处输入。支持 Markdown 排版，可拖入图片或点击工具栏上传。（可选）"
          showImages
          relatedPlan={relatedPlanSelect("contribution")}
        />
      )}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={!canSubmit}>
          {busy ? "保存中…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
