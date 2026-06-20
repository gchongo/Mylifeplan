"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui";
import { ParentTaskSelect } from "@/components/forms/parent-task-select";
import { PlanSelect } from "@/components/forms/plan-select";
import { ROLLUP_STATUS_HINT } from "@/lib/services/task-rollup";

const priorityOptions = [
  { value: "", label: "无" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

const statusOptions = [
  { value: "todo", label: "待办" },
  { value: "in_progress", label: "进行中" },
  { value: "done", label: "已完成" },
];

export interface TaskFormValues {
  id?: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  priority?: string | null;
  status?: string;
  parentTaskId?: string | null;
  planId?: string | null;
}

export function TaskForm({
  task,
  redirectTo = "/tasks",
  defaultPlanId,
  defaultParentTaskId,
  statusRollup = false,
  onSuccess,
  embedded = false,
  submitLabel,
}: {
  task?: TaskFormValues;
  redirectTo?: string;
  defaultPlanId?: string | null;
  defaultParentTaskId?: string | null;
  statusRollup?: boolean;
  onSuccess?: () => void;
  embedded?: boolean;
  submitLabel?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(task?.id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [parentTaskId, setParentTaskId] = useState<string | null>(
    task?.parentTaskId ?? defaultParentTaskId ?? null,
  );
  const [planId, setPlanId] = useState<string | null>(
    task?.planId ?? defaultPlanId ?? null,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const startDate = String(fd.get("startDate") ?? "") || null;
    const dueDate = String(fd.get("dueDate") ?? "") || null;
    const priority = String(fd.get("priority") ?? "") || null;
    const status = String(fd.get("status") ?? "todo");

    const payload = {
      title,
      description: description || null,
      startDate,
      dueDate,
      priority,
      ...(statusRollup && isEdit ? {} : { status }),
      parentTaskId,
      planId,
    };

    try {
      const res = await fetch(isEdit ? `/api/tasks/${task!.id}` : "/api/tasks", {
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
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={embedded ? "space-y-3" : "space-y-4"}>
      {error && <ErrorMessage message={error} />}
      <Input
        name="title"
        label="标题"
        placeholder="任务标题（必填）"
        required
        defaultValue={task?.title ?? ""}
      />
      <Textarea
        name="description"
        label="描述"
        placeholder="可选"
        rows={3}
        defaultValue={task?.description ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="startDate"
          label="开始日期"
          type="date"
          defaultValue={task?.startDate ?? ""}
        />
        <Input
          name="dueDate"
          label="截止日期"
          type="date"
          defaultValue={task?.dueDate ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          name="priority"
          label="优先级"
          options={priorityOptions}
          defaultValue={task?.priority ?? ""}
        />
        {isEdit && !statusRollup && (
          <Select
            name="status"
            label="状态"
            options={statusOptions}
            defaultValue={task?.status ?? "todo"}
          />
        )}
      </div>
      {isEdit && statusRollup && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
          {ROLLUP_STATUS_HINT}
        </p>
      )}
      <ParentTaskSelect
        excludeTaskId={task?.id}
        value={parentTaskId}
        onChange={setParentTaskId}
      />
      <PlanSelect value={planId} onChange={setPlanId} />
      <p className="text-xs text-gray-500">
        无日期 → 备忘录；有开始日期 → 日历 + 甘特图；有开始 + 截止 → 真实截止。
      </p>
      <Button type="submit" disabled={loading} size={embedded ? "sm" : "default"}>
        {loading ? "保存中…" : submitLabel ?? (isEdit ? "保存修改" : "保存任务")}
      </Button>
    </form>
  );
}
