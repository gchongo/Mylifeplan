"use client";

import { useState } from "react";
import { ParentPlanSelect } from "@/components/forms/parent-plan-select";
import { PlanDateTimeField } from "@/components/forms/plan-datetime-field";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { toDatetimeLocalInput } from "@/lib/dates";

export function StickyNoteAssignModal({
  open,
  noteTitle,
  onClose,
  onSubmit,
}: {
  open: boolean;
  noteTitle: string;
  onClose: () => void;
  onSubmit: (data: {
    parentPlanId: string | null;
    startDate: string;
    endDate: string | null;
  }) => Promise<void>;
}) {
  const [parentPlanId, setParentPlanId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => toDatetimeLocalInput(new Date()));
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate.trim()) {
      setError("请设置开始时间");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        parentPlanId,
        startDate: startDate.trim(),
        endDate: endDate.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "分配失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="分配到计划">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          将便签「<span className="font-medium text-gray-900 dark:text-gray-100">{noteTitle}</span>」转为计划并设置时间。
        </p>
        {error && <ErrorMessage message={error} />}
        <ParentPlanSelect value={parentPlanId} onChange={setParentPlanId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanDateTimeField
            label="开始时间"
            value={startDate}
            onConfirm={setStartDate}
            edge="start"
            required
            placeholder="选择开始时间"
          />
          <PlanDateTimeField
            label="结束时间（可选）"
            value={endDate}
            onConfirm={setEndDate}
            edge="end"
            placeholder="选择结束时间"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "分配中…" : "确认分配"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
