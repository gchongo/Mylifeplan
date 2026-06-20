"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui";

const priorityOptions = [
  { value: "", label: "无" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

export function TaskForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          startDate,
          dueDate,
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "创建失败");
        return;
      }
      router.push("/tasks");
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
      <Input name="title" label="标题" placeholder="任务标题（必填）" required />
      <Textarea name="description" label="描述" placeholder="可选" rows={3} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="startDate" label="开始日期" type="date" />
        <Input name="dueDate" label="截止日期" type="date" />
      </div>
      <Select name="priority" label="优先级" options={priorityOptions} defaultValue="" />
      <p className="text-xs text-gray-500">
        无日期 → 备忘录；有开始日期 → 日历 + 甘特图；有开始 + 截止 → 真实截止。
      </p>
      <Button type="submit" disabled={loading}>
        {loading ? "保存中…" : "保存任务"}
      </Button>
    </form>
  );
}
