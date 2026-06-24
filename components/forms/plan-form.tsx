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
import { toDatetimeLocalInput, datetimeLocalToIso, normalizePlanDateInput } from "@/lib/dates";
import type { TranslationKey } from "@/lib/i18n/translate";

const STATUS_VALUES = ["not_started", "in_progress", "done"] as const;

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
  const { t } = useI18n();
  const router = useRouter();
  const statusOptions = useMemo(
    () =>
      STATUS_VALUES.map((value) => ({
        value,
        label: t(`kanban.column.${value}` as TranslationKey),
      })),
    [t],
  );
  const isEdit = Boolean(plan?.id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
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
        setError(data.error ?? t("common.saveFailed"));
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectTo ?? "/plans");
      }
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
        <Select
          name="status"
          label={t("common.status")}
          options={statusOptions}
          defaultValue={plan?.status ?? "not_started"}
        />
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
