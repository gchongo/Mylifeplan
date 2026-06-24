"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
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
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : t("memos.assignModal.convertFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleScheduled(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate.trim()) {
      setError(t("memos.assignModal.errorStart"));
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
      setError(err instanceof Error ? err.message : t("memos.assignModal.assignFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("memos.assignModal.title")}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("memos.assignModal.intro", { title: noteTitle })}
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
            {t("memos.assignModal.unscheduled")}
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
            {t("memos.assignModal.scheduleNow")}
          </button>
        </div>

        {mode === "unscheduled" ? (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("memos.assignModal.unscheduledHint")}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                {t("common.cancel")}
              </Button>
              <Button type="button" disabled={loading} onClick={() => void handleUnscheduled()}>
                {loading ? t("memos.assignModal.converting") : t("memos.assignModal.convertUnscheduled")}
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => void handleScheduled(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <PlanDateTimeField
                label={t("memos.assignModal.startTime")}
                value={startDate}
                onConfirm={setStartDate}
                edge="start"
                required
                placeholder={t("memos.assignModal.selectStart")}
              />
              <PlanDateTimeField
                label={t("memos.assignModal.endTime")}
                value={endDate}
                onConfirm={setEndDate}
                edge="end"
                placeholder={t("memos.assignModal.selectEnd")}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("memos.assignModal.creating") : t("memos.assignModal.createScheduled")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
