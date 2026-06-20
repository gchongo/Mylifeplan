"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const occurredOn = String(fd.get("occurredOn") ?? "").trim();
    const occurredEndOn = String(fd.get("occurredEndOn") ?? "").trim();

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          title,
          description: description || null,
          occurredOn,
          occurredEndOn: occurredEndOn || null,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="occurredOn"
          label="开始日期"
          type="date"
          required
          defaultValue={defaultStartDate}
        />
        <Input
          name="occurredEndOn"
          label="结束日期"
          type="date"
          defaultValue={defaultEndDate ?? defaultStartDate}
        />
      </div>
      <Input name="title" label="标题" placeholder="做了什么（必填）" required />
      <Textarea name="description" label="描述" placeholder="可选" rows={3} />
      <Button type="submit" disabled={loading}>
        {loading ? "保存中…" : "保存贡献"}
      </Button>
    </form>
  );
}
