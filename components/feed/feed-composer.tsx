"use client";

import { useState } from "react";
import { ParentPlanSelect } from "@/components/forms/parent-plan-select";
import { PlanContributionSelect } from "@/components/forms/long-term-plan-select";
import {
  FeedComposeCard,
  type FeedComposeValues,
} from "@/components/feed/feed-compose-card";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/client-api";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { cn } from "@/lib/utils";
import { todayStr } from "@/lib/dates";

type ComposerMode = "memo" | "plan" | "contribution";

const MODES: { id: ComposerMode; label: string; hint: string }[] = [
  { id: "memo", label: "便签", hint: "无日期想法，贴在便签板" },
  { id: "plan", label: "计划", hint: "标题必填；补充时间后可出现在甘特图与日历" },
  { id: "contribution", label: "贡献", hint: "记录计划进展，标题与日期必填" },
];

function emptyCompose(startAt = ""): FeedComposeValues {
  return { title: "", body: "", startAt, endAt: startAt, imageUrls: [] };
}

export function FeedComposer({ onPublished }: { onPublished: () => void }) {
  const [mode, setMode] = useState<ComposerMode>("memo");
  const [memoText, setMemoText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [planValues, setPlanValues] = useState<FeedComposeValues>(() => emptyCompose());
  const [planRelatedId, setPlanRelatedId] = useState<string | null>(null);

  const [contributionValues, setContributionValues] = useState<FeedComposeValues>(() =>
    emptyCompose(todayStr()),
  );
  const [contributionRelatedId, setContributionRelatedId] = useState<string | null>(null);
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
    setPlanValues(emptyCompose());
    setPlanRelatedId(null);
    setContributionValues(emptyCompose(todayStr()));
    setContributionRelatedId(null);
    setPlanListRefreshKey((k) => k + 1);
  }

  async function handlePublish() {
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
        if (!contributionRelatedId) {
          setError("请选择关联计划");
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
          }),
        });
        dispatchPlanUpdated();
      } else if (mode === "plan") {
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
            parentPlanId: planRelatedId,
            startDate: planValues.startAt || null,
            endDate: planValues.endAt || null,
          }),
        });
        dispatchPlanUpdated();
      } else {
        const content = memoText.trim();
        if (!content) return;
        await apiJson("/api/memos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
      }

      resetForm();
      onPublished();
    } catch (e) {
      setError(e instanceof Error ? e.message : "发布失败");
    } finally {
      setBusy(false);
    }
  }

  const activeHint = MODES.find((m) => m.id === mode)?.hint ?? "";

  const relatedPlanSelect = (variant: "plan" | "contribution") =>
    variant === "plan" ? (
      <ParentPlanSelect
        value={planRelatedId}
        onChange={setPlanRelatedId}
        label="关联计划（可选）"
        emptyLabel="不关联计划"
      />
    ) : (
      <PlanContributionSelect
        value={contributionRelatedId}
        onChange={setContributionRelatedId}
        refreshKey={planListRefreshKey}
      />
    );

  return (
    <div className="feed-composer shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
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

        <div className="flex shrink-0 items-center gap-2">
          {error && <span className="max-w-[10rem] truncate text-xs text-red-500">{error}</span>}
          <Button type="button" size="sm" disabled={!canPublish} onClick={handlePublish}>
            {busy ? "发布中…" : "发布"}
          </Button>
        </div>
      </div>

      <p className="border-b border-gray-50 px-3 py-1 text-xs text-gray-400 dark:border-gray-800">
        {activeHint}
      </p>

      <div className="p-3">
        {mode === "plan" && (
          <FeedComposeCard
            values={planValues}
            onChange={(patch) => setPlanValues((prev) => ({ ...prev, ...patch }))}
            timeKind="datetime"
            titlePlaceholder="输入计划标题"
            bodyPlaceholder="计划描述与细节，支持 Markdown。（可选）"
            relatedPlan={relatedPlanSelect("plan")}
          />
        )}

        {mode === "contribution" && (
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

        {mode === "memo" && (
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="此刻的想法…"
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-200 bg-transparent px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-gray-100"
          />
        )}
      </div>
    </div>
  );
}
