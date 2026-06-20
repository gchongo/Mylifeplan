"use client";

import { useState } from "react";
import { PlanContributionSelect } from "@/components/forms/long-term-plan-select";
import { Button } from "@/components/ui/button";

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

export function FeedComposer({ onPublished }: { onPublished: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [contributionPlanId, setContributionPlanId] = useState<string | null>(null);
  const [occurredOn, setOccurredOn] = useState(todayStr);
  const [planListRefreshKey, setPlanListRefreshKey] = useState(0);

  const canSave = text.trim().length > 0 && !busy;

  async function handleSave() {
    const { title, description } = splitContent(text);
    if (!title) return;

    setBusy(true);
    setError("");
    try {
      if (contributionPlanId) {
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
          return;
        }
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
      setPlanListRefreshKey((k) => k + 1);
      onPublished();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="feed-composer shrink-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="此刻的想法…（无日期时保存为备忘；关联计划则记为贡献）"
        rows={3}
        className="w-full resize-none border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
      />

      <div className="space-y-2 border-t border-gray-100 pt-2">
        <PlanContributionSelect
          value={contributionPlanId}
          onChange={setContributionPlanId}
          refreshKey={planListRefreshKey}
        />
        {contributionPlanId && (
          <label className="flex items-center gap-2 text-xs text-gray-500">
            贡献日期
            <input
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-800"
            />
          </label>
        )}
      </div>

      <div className="mt-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2">
        {error && <span className="text-xs text-red-500">{error}</span>}
        <Button type="button" size="sm" disabled={!canSave} onClick={handleSave}>
          {busy ? "保存中…" : "保存"}
        </Button>
      </div>
    </div>
  );
}
