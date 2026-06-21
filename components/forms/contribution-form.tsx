"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import {
  ContributionEditor,
  type ContributionEditorValues,
} from "@/components/contributions/contribution-editor";

export function ContributionForm({
  planId,
  defaultStartDate,
  defaultEndDate,
  onSuccess,
}: {
  planId: string;
  defaultStartDate: string;
  defaultEndDate?: string;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<ContributionEditorValues>({
    title: "",
    body: "",
    occurredOn: defaultStartDate,
    occurredEndOn: defaultEndDate ?? defaultStartDate,
    imageUrls: [],
  });

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
          occurredEndOn: values.occurredEndOn || null,
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
      {error && <ErrorMessage message={error} />}
      <ContributionEditor values={values} onChange={patch} />
      <Button type="submit" disabled={loading}>
        {loading ? "保存中…" : "保存贡献"}
      </Button>
    </form>
  );
}
