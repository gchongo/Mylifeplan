"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui";
import { ParentPlanSelect } from "@/components/forms/parent-plan-select";
import { PlanColorPicker } from "@/components/forms/plan-color-picker";
import { PlanDateTimeField } from "@/components/forms/plan-datetime-field";
import { toDatetimeLocalInput, datetimeLocalToIso, normalizePlanDateInput, nowDatetimeLocal } from "@/lib/dates";
import { isPlanUnscheduled } from "@/lib/content-router";
import { kanbanPatchForColumn, UNSCHEDULED_BLOCKED_HINT, type KanbanPlan } from "@/lib/kanban-board";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";
import type { TranslationKey } from "@/lib/i18n/translate";

const FORM_STATUS_VALUES = ["unscheduled", "not_started", "in_progress", "done"] as const;
type FormStatusValue = (typeof FORM_STATUS_VALUES)[number];

function initialFormStatus(plan?: PlanFormValues): FormStatusValue {
  if (plan && isPlanUnscheduled({ startDate: plan.startDate, endDate: plan.endDate })) {
    return "unscheduled";
  }
  const status = plan?.status ?? "not_started";
  if (status === "in_progress" || status === "done") return status;
  return "not_started";
}

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
  contributionCount = 0,
}: {
  plan?: PlanFormValues;
  redirectTo?: string;
  defaultParentPlanId?: string | null;
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
  onSuccess?: (plan?: SerializedPlanForGantt) => void;
  onCancel?: () => void;
  submitLabel?: string;
  hasSubPlans?: boolean;
  contributionCount?: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const statusOptions = useMemo(
    () =>
      FORM_STATUS_VALUES.map((value) => ({
        value,
        label: t(`kanban.column.${value}` as TranslationKey),
      })),
    [t],
  );
  const isEdit = Boolean(plan?.id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<FormStatusValue>(() => initialFormStatus(plan));
  const [parentPlanId, setParentPlanId] = useState<string | null>(
    plan?.parentPlanId ?? defaultParentPlanId ?? null,
  );
  const [startDate, setStartDate] = useState(
    () => toDatetimeLocalInput(plan?.startDate ?? defaultStartDate) || "",
  );
  const [endDate, setEndDate] = useState(
    () => toDatetimeLocalInput(plan?.endDate ?? defaultEndDate) || "",
  );
  const [actualStartDate, setActualStartDate] = useState(
    () => toDatetimeLocalInput(plan?.actualStartDate) || "",
  );
  const [actualEndDate, setActualEndDate] = useState(
    () => toDatetimeLocalInput(plan?.actualEndDate) || "",
  );

  const canMoveToUnscheduled = contributionCount === 0;

  function handleScheduleStatusChange(next: FormStatusValue) {
    if (next === "unscheduled" && !canMoveToUnscheduled) {
      setError(UNSCHEDULED_BLOCKED_HINT);
      return;
    }
    setError("");
    setScheduleStatus(next);
    if (next === "unscheduled") {
      setStartDate("");
      setEndDate("");
    } else if (next === "not_started" || next === "in_progress") {
      if (!startDate.trim()) setStartDate(nowDatetimeLocal());
    }
  }

  function buildSchedulePayload(): {
    status: string;
    startDate: string | null;
    endDate: string | null;
  } {
    const kanbanPlan: KanbanPlan = {
      id: plan?.id ?? "",
      title: plan?.title ?? "",
      description: plan?.description ?? null,
      type: "goal",
      status: (plan?.status as KanbanPlan["status"]) ?? "not_started",
      startDate: plan?.startDate ?? null,
      endDate: plan?.endDate ?? null,
      parentPlanId: parentPlanId,
      parentTitle: null,
      childStatuses: hasSubPlans ? ["not_started"] : [],
      contributionCount,
    };

    if (scheduleStatus === "unscheduled") {
      const patch = kanbanPatchForColumn("unscheduled", kanbanPlan);
      return {
        status: patch.status,
        startDate: patch.startDate ?? null,
        endDate: patch.endDate ?? null,
      };
    }

    if (scheduleStatus === "done") {
      return {
        status: "done",
        startDate: startDate ? datetimeLocalToIso(normalizePlanDateInput(startDate, "start")!) : null,
        endDate: endDate ? datetimeLocalToIso(normalizePlanDateInput(endDate, "end")!) : null,
      };
    }

    const columnPatch = kanbanPatchForColumn(scheduleStatus, {
      ...kanbanPlan,
      startDate: startDate ? datetimeLocalToIso(normalizePlanDateInput(startDate, "start")!) : null,
      endDate: endDate ? datetimeLocalToIso(normalizePlanDateInput(endDate, "end")!) : null,
    });

    let startIso = startDate ? datetimeLocalToIso(normalizePlanDateInput(startDate, "start")!) : null;
    let endIso = endDate ? datetimeLocalToIso(normalizePlanDateInput(endDate, "end")!) : null;

    if (columnPatch.startDate !== undefined) {
      startIso = columnPatch.startDate
        ? datetimeLocalToIso(normalizePlanDateInput(columnPatch.startDate, "start")!)
        : null;
    }
    if (columnPatch.endDate !== undefined) {
      endIso = columnPatch.endDate
        ? datetimeLocalToIso(normalizePlanDateInput(columnPatch.endDate, "end")!)
        : null;
    }

    return {
      status: columnPatch.status,
      startDate: startIso,
      endDate: endIso,
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const color = String(fd.get("color") ?? "").trim() || null;

    const canEditActual = isEdit && !hasSubPlans;

    const normalizedActualStart =
      canEditActual && actualStartDate ? normalizePlanDateInput(actualStartDate, "start") : null;
    const normalizedActualEnd =
      canEditActual && actualEndDate ? normalizePlanDateInput(actualEndDate, "end") : null;

    let scheduleFields = {
      status: plan?.status ?? "not_started",
      startDate: startDate ? datetimeLocalToIso(normalizePlanDateInput(startDate, "start")!) : null,
      endDate: endDate ? datetimeLocalToIso(normalizePlanDateInput(endDate, "end")!) : null,
    };

    if (isEdit) {
      try {
        scheduleFields = buildSchedulePayload();
      } catch (err) {
        setError(err instanceof Error ? err.message : UNSCHEDULED_BLOCKED_HINT);
        setLoading(false);
        return;
      }
    }

    const payload = {
      title,
      description: description || null,
      type: plan?.type ?? "goal",
      parentPlanId,
      startDate: scheduleFields.startDate,
      endDate: scheduleFields.endDate,
      actualStartDate: canEditActual
        ? normalizedActualStart
          ? datetimeLocalToIso(normalizedActualStart)
          : null
        : undefined,
      actualEndDate: canEditActual
        ? normalizedActualEnd
          ? datetimeLocalToIso(normalizedActualEnd)
          : null
        : undefined,
      color,
      ...(isEdit && { status: scheduleFields.status }),
    };

    try {
      const res = await fetch(isEdit ? `/api/plans/${plan!.id}` : "/api/plans", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.saveFailed"));
        return;
      }

      if (onSuccess) {
        onSuccess(data.plan);
      } else {
        router.push(redirectTo ?? "/plans");
      }
      dispatchPlanUpdated({ plan: data.plan });
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <Input
        name="title"
        label={t("common.title")}
        placeholder={t("forms.planTitleRequired")}
        required
        defaultValue={plan?.title ?? ""}
      />
      <Textarea
        name="description"
        label={t("common.description")}
        placeholder={t("forms.optional")}
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
        <PlanDateTimeField
          label={t("forms.planStart")}
          value={startDate}
          onConfirm={setStartDate}
          edge="start"
          placeholder={t("forms.selectStart")}
        />
        <PlanDateTimeField
          label={t("forms.planEnd")}
          value={endDate}
          onConfirm={setEndDate}
          edge="end"
          placeholder={t("forms.selectEnd")}
        />
      </div>
      {isEdit && hasSubPlans && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("forms.rollupHint")}
        </p>
      )}
      {isEdit && !hasSubPlans && (
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanDateTimeField
            label={t("forms.actualStart")}
            value={actualStartDate}
            onConfirm={setActualStartDate}
            edge="start"
            placeholder={t("forms.selectActualStart")}
          />
          <PlanDateTimeField
            label={t("forms.actualEnd")}
            value={actualEndDate}
            onConfirm={setActualEndDate}
            edge="end"
            placeholder={t("forms.selectActualEnd")}
          />
        </div>
      )}
      {isEdit && (
        <div className="space-y-1">
          <Select
            name="status"
            label={t("common.status")}
            options={statusOptions}
            value={scheduleStatus}
            onChange={(e) => handleScheduleStatusChange(e.target.value as FormStatusValue)}
          />
          {scheduleStatus === "unscheduled" && (
            <p className="text-xs text-violet-600 dark:text-violet-400">{t("memos.assignModal.unscheduledHint")}</p>
          )}
          {!canMoveToUnscheduled && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{UNSCHEDULED_BLOCKED_HINT}</p>
          )}
        </div>
      )}
      {onCancel ? (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t("common.saving") : (submitLabel ?? (isEdit ? t("forms.saveChanges") : t("forms.savePlan")))}
          </Button>
        </div>
      ) : (
        <Button type="submit" disabled={loading}>
          {loading ? t("common.saving") : (submitLabel ?? (isEdit ? t("forms.saveChanges") : t("forms.savePlan")))}
        </Button>
      )}
    </form>
  );
}
