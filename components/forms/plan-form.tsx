"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui";
import { ParentPlanSelect } from "@/components/forms/parent-plan-select";

const typeOptions = [
  { value: "goal", label: "长期目标 (goal)" },
  { value: "phase", label: "阶段计划 (phase)" },
  { value: "weekly", label: "周计划 (weekly)" },
  { value: "daily", label: "日计划 (daily)" },
];

const statusOptions = [
  { value: "not_started", label: "未开始" },
  { value: "in_progress", label: "进行中" },
  { value: "done", label: "已完成" },
];

export interface PlanFormValues {
  id?: string;
  title: string;
  description?: string | null;
  type: string;
  parentPlanId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
}

export function PlanForm({
  defaultType = "goal",
  plan,
  redirectTo,
}: {
  defaultType?: string;
  plan?: PlanFormValues;
  redirectTo?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(plan?.id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(plan?.type ?? defaultType);
  const [parentPlanId, setParentPlanId] = useState<string | null>(
    plan?.parentPlanId ?? null,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const planType = String(fd.get("type") ?? type);
    const startDate = String(fd.get("startDate") ?? "") || null;
    const endDate = String(fd.get("endDate") ?? "") || null;
    const status = String(fd.get("status") ?? "not_started");

    const payload = {
      title,
      description: description || null,
      type: planType,
      parentPlanId,
      startDate,
      endDate,
      ...(isEdit && { status }),
    };

    try {
      const res = await fetch(isEdit ? `/api/plans/${plan!.id}` : "/api/plans", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "保存失败");
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push(
          planType === "goal" || planType === "phase" ? "/plans/long" : "/plans/short",
        );
      }
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
      <Input
        name="title"
        label="标题"
        placeholder="计划标题（必填）"
        required
        defaultValue={plan?.title ?? ""}
      />
      <Textarea
        name="description"
        label="描述"
        placeholder="可选"
        rows={3}
        defaultValue={plan?.description ?? ""}
      />
      {!isEdit && (
        <Select
          name="type"
          label="类型"
          options={typeOptions}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setParentPlanId(null);
          }}
        />
      )}
      {isEdit && (
        <Select
          name="type"
          label="类型"
          options={typeOptions.filter((o) => o.value === type)}
          value={type}
          disabled
        />
      )}
      <ParentPlanSelect planType={type} value={parentPlanId} onChange={setParentPlanId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="startDate"
          label="开始日期"
          type="date"
          defaultValue={plan?.startDate ?? ""}
        />
        <Input
          name="endDate"
          label="结束日期"
          type="date"
          defaultValue={plan?.endDate ?? ""}
        />
      </div>
      {isEdit && (
        <Select
          name="status"
          label="状态"
          options={statusOptions}
          defaultValue={plan?.status ?? "not_started"}
        />
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "保存中…" : isEdit ? "保存修改" : "保存计划"}
      </Button>
    </form>
  );
}
