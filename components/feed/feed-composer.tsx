"use client";

import { useState } from "react";
import { ParentPlanSelect } from "@/components/forms/parent-plan-select";
import { PlanContributionSelect } from "@/components/forms/long-term-plan-select";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type ComposerMode = "memo" | "plan" | "contribution";

const MODES: { id: ComposerMode; label: string; hint: string }[] = [
  { id: "memo", label: "备忘", hint: "无日期想法，保存在备忘录" },
  { id: "plan", label: "计划", hint: "可设日期，出现在甘特图与日历" },
  { id: "contribution", label: "贡献", hint: "记录某一天的计划进展" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function splitContent(text: string): { title: string; description: string | null } {
  const trimmed = text.trim();
  if (!trimmed) return { title: "", description: null };
  const lines = trimmed.split(/\n/);
  const title = lines[0]!.slice(0, 200);
  const rest = lines.slice(1).join("\n").trim();
  return { title, description: rest || null };
}

const PLACEHOLDERS: Record<ComposerMode, string> = {
  memo: "此刻的想法…",
  plan: "计划做什么？第一行作为标题，换行可写描述",
  contribution: "今天对计划做了什么？第一行作为标题",
};

export function FeedComposer({ onPublished }: { onPublished: () => void }) {
  const [mode, setMode] = useState<ComposerMode>("memo");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [parentPlanId, setParentPlanId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [contributionPlanId, setContributionPlanId] = useState<string | null>(null);
  const [occurredOn, setOccurredOn] = useState(todayStr);
  const [planListRefreshKey, setPlanListRefreshKey] = useState(0);

  const canPublish = text.trim().length > 0 && !busy;

  function resetForm() {
    setText("");
    setParentPlanId(null);
    setStartDate("");
    setEndDate("");
    setContributionPlanId(null);
    setOccurredOn(todayStr());
    setPlanListRefreshKey((k) => k + 1);
  }

  async function handlePublish() {
    const { title, description } = splitContent(text);
    if (!title) return;

    setBusy(true);
    setError("");
    try {
      if (mode === "contribution") {
        if (!contributionPlanId) {
          setError("请选择要关联的计划");
          return;
        }
        await apiJson("/api/contributions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: contributionPlanId,
            title,
            description,
            occurredOn,
          }),
        });
      } else if (mode === "plan") {
        await apiJson("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            type: "goal",
            parentPlanId,
            startDate: startDate || null,
            endDate: endDate || null,
          }),
        });
      } else {
        await apiJson("/api/memos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
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

  return (
    <div className="feed-composer shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
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
                  ? "bg-brand-100 text-brand-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
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

      <p className="border-b border-gray-50 px-3 py-1 text-xs text-gray-400">{activeHint}</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDERS[mode]}
        rows={3}
        className="w-full resize-none border-0 bg-transparent px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
      />

      {mode === "plan" && (
        <div className="space-y-2 border-t border-gray-100 px-3 py-2">
          <ParentPlanSelect value={parentPlanId} onChange={setParentPlanId} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs text-gray-500">
              开始时间
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800"
              />
            </label>
            <label className="block text-xs text-gray-500">
              结束时间
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800"
              />
            </label>
          </div>
        </div>
      )}

      {mode === "contribution" && (
        <div className="grid gap-2 border-t border-gray-100 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <PlanContributionSelect
            value={contributionPlanId}
            onChange={setContributionPlanId}
            refreshKey={planListRefreshKey}
            inline
          />
          <label className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
            贡献日期
            <input
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800"
            />
          </label>
        </div>
      )}
    </div>
  );
}
