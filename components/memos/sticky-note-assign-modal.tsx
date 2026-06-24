"use client";

import { useState } from "react";
import { ParentPlanSelect } from "@/components/forms/parent-plan-select";
import { PlanDateTimeField } from "@/components/forms/plan-datetime-field";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { toDatetimeLocalInput } from "@/lib/dates";

type AssignMode = "unscheduled" | "scheduled";

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
    startDate: string | null;
    endDate: string | null;
  }) => Promise<void>;
}) {
  const [mode, setMode] = useState<AssignMode>("unscheduled");
  const [parentPlanId, setParentPlanId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => toDatetimeLocalInput(new Date()));
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUnscheduled() {
    setError("");
    setLoading(true);
    try {
      await onSubmit({ parentPlanId, startDate: null, endDate: null });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "转换失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleScheduled(e: React.FormEvent) {
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
    <Modal open={open} onClose={onClose} title="转为计划">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          将便签「<span className="font-medium text-gray-900 dark:text-gray-100">{noteTitle}</span>」转为计划。便签内容会写入计划描述，原便签删除。
        </p>
        {error && <ErrorMessage message={error} />}
        <ParentPlanSelect value={parentPlanId} onChange={setParentPlanId} />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("unscheduled")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
              mode === "unscheduled"
                ? "border-violet-400 bg-violet-50 text-violet-800 dark:border-violet-500 dark:bg-violet-950/40 dark:text-violet-200"
                : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
            }`}
          >
            未排期
          </button>
          <button
            type="button"
            onClick={() => setMode("scheduled")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
              mode === "scheduled"
                ? "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100"
                : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
            }`}
          >
            立即排期
          </button>
        </div>

        {mode === "unscheduled" ? (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              进入计划看板「未排期」列，稍后再设时间；不会出现在甘特时间轴上。
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                取消
              </Button>
              <Button type="button" disabled={loading} onClick={() => void handleUnscheduled()}>
                {loading ? "转换中…" : "转为未排期计划"}
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => void handleScheduled(e)} className="space-y-4">
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
                {loading ? "创建中…" : "创建并排期"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
