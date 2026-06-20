"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui";

const typeOptions = [
  { value: "goal", label: "长期目标 (goal)" },
  { value: "phase", label: "阶段计划 (phase)" },
  { value: "weekly", label: "周计划 (weekly)" },
  { value: "daily", label: "日计划 (daily)" },
];

export function PlanForm({ defaultType = "goal" }: { defaultType?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(defaultType);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const planType = String(fd.get("type") ?? type);
    const parentPlanId = String(fd.get("parentPlanId") ?? "").trim() || null;
    const startDate = String(fd.get("startDate") ?? "") || null;
    const endDate = String(fd.get("endDate") ?? "") || null;

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          type: planType,
          parentPlanId,
          startDate,
          endDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "创建失败");
        return;
      }
      router.push(planType === "goal" || planType === "phase" ? "/plans/long" : "/plans/short");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <Input name="title" label="标题" placeholder="计划标题（必填）" required />
      <Textarea name="description" label="描述" placeholder="可选" rows={3} />
      <Select
        name="type"
        label="类型"
        options={typeOptions}
        value={type}
        onChange={(e) => setType(e.target.value)}
      />
      {(type === "phase" || type === "weekly" || type === "daily") && (
        <Input
          name="parentPlanId"
          label="父计划 ID（phase 必填 goal ID；短期可选 phase ID）"
          placeholder="粘贴父计划 ID"
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="startDate" label="开始日期" type="date" />
        <Input name="endDate" label="结束日期" type="date" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "保存中…" : "保存计划"}
      </Button>
    </form>
  );
}
