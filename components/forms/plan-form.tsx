"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui";
import { ParentPlanSelect } from "@/components/forms/parent-plan-select";
import { PlanColorPicker } from "@/components/forms/plan-color-picker";
import { toDatetimeLocalInput, datetimeLocalToIso, normalizePlanDateInput } from "@/lib/dates";

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
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  status?: string;
  color?: string | null;
}

export function PlanForm({
  plan,
  redirectTo,
  defaultParentPlanId,
  defaultStartDate,
  defaultEndDate,
  onSuccess,
  onCancel,
  submitLabel,
  hasSubPlans = false,
}: {
  plan?: PlanFormValues;
  redirectTo?: string;
  defaultParentPlanId?: string | null;
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  /** 有子计划时实际起止由子计划汇总，不可手填 */
  hasSubPlans?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(plan?.id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [parentPlanId, setParentPlanId] = useState<string | null>(
    plan?.parentPlanId ?? defaultParentPlanId ?? null,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const startDate = String(fd.get("startDate") ?? "") || null;
    const endDate = String(fd.get("endDate") ?? "") || null;
    const actualStartDate = String(fd.get("actualStartDate") ?? "") || null;
    const actualEndDate = String(fd.get("actualEndDate") ?? "") || null;
    const status = String(fd.get("status") ?? "not_started");
    const color = String(fd.get("color") ?? "").trim() || null;

    const canEditActual = isEdit && !hasSubPlans;

    const normalizedStart = startDate ? normalizePlanDateInput(startDate, "start") : null;
    const normalizedEnd = endDate ? normalizePlanDateInput(endDate, "end") : null;
    const normalizedActualStart =
      canEditActual && actualStartDate ? normalizePlanDateInput(actualStartDate, "start") : null;
    const normalizedActualEnd =
      canEditActual && actualEndDate ? normalizePlanDateInput(actualEndDate, "end") : null;

    const payload = {
      title,
      description: description || null,
      type: plan?.type ?? "goal",
      parentPlanId,
      startDate: normalizedStart ? datetimeLocalToIso(normalizedStart) : null,
      endDate: normalizedEnd ? datetimeLocalToIso(normalizedEnd) : null,
      actualStartDate: normalizedActualStart ? datetimeLocalToIso(normalizedActualStart) : undefined,
      actualEndDate: normalizedActualEnd ? datetimeLocalToIso(normalizedActualEnd) : undefined,
      color,
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

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectTo ?? "/plans");
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
      <ParentPlanSelect
        value={parentPlanId}
        onChange={setParentPlanId}
        excludePlanId={plan?.id}
      />
      <PlanColorPicker defaultValue={plan?.color} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="startDate"
          label="计划开始"
          type="datetime-local"
          defaultValue={toDatetimeLocalInput(plan?.startDate ?? defaultStartDate)}
        />
        <Input
          name="endDate"
          label="计划结束"
          type="datetime-local"
          defaultValue={toDatetimeLocalInput(plan?.endDate ?? defaultEndDate)}
        />
      </div>
      {isEdit && hasSubPlans && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          该计划含有子计划，实际开始与结束由子计划自动汇总，无法在父计划上手动填写。
        </p>
      )}
      {isEdit && !hasSubPlans && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="actualStartDate"
            label="实际开始"
            type="datetime-local"
            defaultValue={toDatetimeLocalInput(plan?.actualStartDate)}
          />
          <Input
            name="actualEndDate"
            label="实际结束"
            type="datetime-local"
            defaultValue={toDatetimeLocalInput(plan?.actualEndDate)}
          />
        </div>
      )}
      {isEdit && (
        <Select
          name="status"
          label="状态"
          options={statusOptions}
          defaultValue={plan?.status ?? "not_started"}
        />
      )}
      {onCancel ? (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "保存中…" : (submitLabel ?? (isEdit ? "保存修改" : "保存计划"))}
          </Button>
        </div>
      ) : (
        <Button type="submit" disabled={loading}>
          {loading ? "保存中…" : (submitLabel ?? (isEdit ? "保存修改" : "保存计划"))}
        </Button>
      )}
    </form>
  );
}
