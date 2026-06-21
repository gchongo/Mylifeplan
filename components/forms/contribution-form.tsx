"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import {
  ContributionEditor,
  emptyContributionValues,
  type ContributionEditorValues,
} from "@/components/contributions/contribution-editor";

export function ContributionForm({
  planId,
  defaultStartDate,
  defaultEndDate,
  onSuccess,
  onCancel,
  showHeader = true,
}: {
  planId: string;
  defaultStartDate: string;
  defaultEndDate?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<ContributionEditorValues>(() =>
    emptyContributionValues(defaultStartDate, defaultEndDate),
  );

  function patch(patch: Partial<ContributionEditorValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const title = values.title.trim();
    if (!title) {
      setError("请填写标题");
      return;
    }
    if (!values.occurredOn) {
      setError("请选择时间");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          title,
          body: values.body.trim() || null,
          imageUrls: values.imageUrls.length ? values.imageUrls : undefined,
          occurredOn: values.occurredOn,
          occurredEndOn:
            values.occurredEndOn && values.occurredEndOn !== values.occurredOn
              ? values.occurredEndOn
              : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      onSuccess?.();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showHeader && (
        <div className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-sm text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            +
          </span>
          创建贡献
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      <ContributionEditor values={values} onChange={patch} mode="compose" />

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type="submit" size="sm" disabled={loading || !values.title.trim() || !values.occurredOn}>
          {loading ? "保存中…" : "保存贡献"}
        </Button>
      </div>
    </form>
  );
}
