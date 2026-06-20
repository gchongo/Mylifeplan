"use client";

import { useState } from "react";
import { TaskForm } from "@/components/forms/task-form";
import { PlanContributionSelect } from "@/components/forms/long-term-plan-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FeedComposerMode = "memo" | "task";

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

function ModeToggle({
  mode,
  onChange,
}: {
  mode: FeedComposerMode;
  onChange: (mode: FeedComposerMode) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange("memo")}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
          mode === "memo"
            ? "bg-brand-50 text-brand-700"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
        )}
        title="发布备忘"
        aria-label="发布备忘"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={() => onChange("task")}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
          mode === "task"
            ? "bg-brand-50 text-brand-700"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
        )}
        title="发布计划（任务）"
        aria-label="发布计划"
      >
        ☑
      </button>
    </div>
  );
}

function ContributionFields({
  planId,
  onPlanChange,
  occurredOn,
  onDateChange,
  planListRefreshKey,
}: {
  planId: string | null;
  onPlanChange: (id: string | null) => void;
  occurredOn: string;
  onDateChange: (date: string) => void;
  planListRefreshKey: number;
}) {
  return (
    <div className="space-y-2 border-t border-gray-100 pt-2">
      <PlanContributionSelect
        value={planId}
        onChange={onPlanChange}
        refreshKey={planListRefreshKey}
      />
      {planId && (
        <label className="flex items-center gap-2 text-xs text-gray-500">
          贡献日期
          <input
            type="date"
            value={occurredOn}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-800"
          />
        </label>
      )}
    </div>
  );
}

export function FeedComposer({ onPublished }: { onPublished: () => void }) {
  const [mode, setMode] = useState<FeedComposerMode>("memo");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [taskFormKey, setTaskFormKey] = useState(0);
  const [contributionPlanId, setContributionPlanId] = useState<string | null>(null);
  const [occurredOn, setOccurredOn] = useState(todayStr);
  const [planListRefreshKey, setPlanListRefreshKey] = useState(0);

  function bumpPlanList() {
    setPlanListRefreshKey((k) => k + 1);
  }

  const canSaveMemo = text.trim().length > 0 && !busy;

  async function createContribution(title: string, description: string | null) {
    if (!contributionPlanId) return true;
    const res = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: contributionPlanId,
        title,
        description,
        occurredOn,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "贡献记录失败");
      return false;
    }
    return true;
  }

  async function handleMemoSave() {
    const { title, description } = splitContent(text);
    if (!title) return;

    setBusy(true);
    setError("");
    try {
      if (contributionPlanId) {
        const ok = await createContribution(title, description);
        if (!ok) return;
      } else {
        const res = await fetch("/api/memos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "发布失败");
          return;
        }
      }

      setText("");
      setContributionPlanId(null);
      setOccurredOn(todayStr());
      bumpPlanList();
      onPublished();
    } finally {
      setBusy(false);
    }
  }

  function handleTaskCancel() {
    setMode("memo");
    setContributionPlanId(null);
    setOccurredOn(todayStr());
    setTaskFormKey((k) => k + 1);
  }

  if (mode === "task") {
    return (
      <div className="feed-composer shrink-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <ContributionFields
          planId={contributionPlanId}
          onPlanChange={setContributionPlanId}
          occurredOn={occurredOn}
          onDateChange={setOccurredOn}
          planListRefreshKey={planListRefreshKey}
        />
        <div className="mt-3">
          <TaskForm
            key={taskFormKey}
            embedded
            submitLabel="保存"
            onCancel={handleTaskCancel}
            contributionPlanId={contributionPlanId}
            contributionDate={occurredOn}
            onSuccess={() => {
              setContributionPlanId(null);
              setOccurredOn(todayStr());
              bumpPlanList();
              onPublished();
              setTaskFormKey((k) => k + 1);
            }}
          />
        </div>
        <div className="mt-3 border-t border-gray-100 pt-2">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </div>
    );
  }

  return (
    <div className="feed-composer shrink-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="此刻的想法…"
        rows={3}
        className="w-full resize-none border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
      />

      <ContributionFields
        planId={contributionPlanId}
        onPlanChange={setContributionPlanId}
        occurredOn={occurredOn}
        onDateChange={setOccurredOn}
        planListRefreshKey={planListRefreshKey}
      />

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
        <ModeToggle mode={mode} onChange={setMode} />
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <Button type="button" size="sm" disabled={!canSaveMemo} onClick={handleMemoSave}>
            {busy ? "保存中…" : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
