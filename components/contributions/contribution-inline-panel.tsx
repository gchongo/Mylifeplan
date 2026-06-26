"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { ContributionMarkdown } from "@/components/contributions/contribution-markdown";
import { UploadImage } from "@/components/ui/upload-image";
import { ContributionPlanSelect } from "@/components/forms/contribution-plan-select";
import {
  ContributionEditor,
  contributionValuesFromApi,
  type ContributionEditorValues,
} from "@/components/contributions/contribution-editor";
import {
  MenuIconDelete,
  MenuIconEdit,
  MenuIconSubPlan,
  PlanDetailActionsMenu,
} from "@/components/plans/plan-detail-actions-menu";
import { cn } from "@/lib/utils";

export interface ContributionInlineData {
  id: string;
  planId: string;
  planTitle?: string;
  title: string;
  description?: string | null;
  body?: string | null;
  imageUrls?: string[];
  occurredOn: string;
  occurredEndOn?: string | null;
  markerColor?: string | null;
}

const PREVIEW_CHAR_LIMIT = 300;

type EditMode = null | "content" | "plan";

function editorValuesFromEntry(entry: ContributionInlineData): ContributionEditorValues {
  return {
    title: entry.title,
    body: entry.body ?? entry.description ?? "",
    ...contributionValuesFromApi(entry),
    imageUrls: entry.imageUrls ?? [],
    markerColor: entry.markerColor ?? null,
  };
}

export function ContributionInlinePanel({
  entry,
  onChanged,
  showTitle = true,
  showOccurredDate = true,
  showMenu = true,
  showSubPlanHint = false,
  headerPrefix,
  currentPlanId,
  menuClassName,
}: {
  entry: ContributionInlineData;
  onChanged?: () => void;
  showTitle?: boolean;
  showOccurredDate?: boolean;
  showMenu?: boolean;
  showSubPlanHint?: boolean;
  headerPrefix?: ReactNode;
  currentPlanId?: string;
  menuClassName?: string;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [planId, setPlanId] = useState(entry.planId);
  const [editorValues, setEditorValues] = useState<ContributionEditorValues>(() =>
    editorValuesFromEntry(entry),
  );

  const fullContent = entry.body?.trim() || entry.description?.trim() || "";
  const dateLabel =
    entry.occurredEndOn && entry.occurredEndOn !== entry.occurredOn
      ? `${formatPlanDateTimeDisplay(entry.occurredOn)} ~ ${formatPlanDateTimeDisplay(entry.occurredEndOn)}`
      : formatPlanDateTimeDisplay(entry.occurredOn);
  const isOtherPlan =
    showSubPlanHint && currentPlanId != null && entry.planId !== currentPlanId;
  const needsExpand = fullContent.length > PREVIEW_CHAR_LIMIT;
  const menuDisabled = saving || deleting;

  function resetEditor() {
    setEditorValues(editorValuesFromEntry(entry));
    setPlanId(entry.planId);
    setSaveError("");
  }

  function cancelEdit() {
    resetEditor();
    setEditMode(null);
  }

  async function handleSaveContent() {
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/contributions/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editorValues.title.trim(),
          body: editorValues.body.trim() || null,
          imageUrls: editorValues.imageUrls,
          occurredOn: editorValues.occurredOn,
          occurredEndOn: editorValues.occurredEndOn || null,
          markerColor: editorValues.markerColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? t("gantt.contributionDrawer.saveFailed"));
        return;
      }
      setEditMode(null);
      onChanged?.();
      dispatchPlanUpdated();
    } catch {
      setSaveError(t("gantt.contributionDrawer.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePlan() {
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/contributions/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? t("gantt.contributionDrawer.saveFailed"));
        return;
      }
      setEditMode(null);
      onChanged?.();
      dispatchPlanUpdated();
    } catch {
      setSaveError(t("gantt.contributionDrawer.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t("gantt.contributionDrawer.confirmDelete", { title: entry.title }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contributions/${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        onChanged?.();
        dispatchPlanUpdated();
      }
    } finally {
      setDeleting(false);
    }
  }

  const menuItems = [
    {
      id: "edit",
      label: t("gantt.contributionDrawer.editContent"),
      icon: <MenuIconEdit />,
      onClick: () => {
        resetEditor();
        setEditMode("content");
      },
    },
    {
      id: "plan",
      label: t("gantt.contributionDrawer.changePlan"),
      icon: <MenuIconSubPlan />,
      onClick: () => {
        resetEditor();
        setEditMode("plan");
      },
    },
    {
      id: "delete",
      label: t("gantt.contributionDrawer.deleteRecord"),
      icon: <MenuIconDelete />,
      destructive: true,
      onClick: () => void handleDelete(),
    },
  ];

  return (
    <div className="space-y-2">
      {(headerPrefix || showTitle || showOccurredDate || showMenu) && (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            {headerPrefix}
            {showTitle && (
              <span className="block font-medium text-gray-900 dark:text-gray-100">{entry.title}</span>
            )}
            {showOccurredDate && <span className="block text-xs text-gray-400">{dateLabel}</span>}
            {isOtherPlan && entry.planTitle && (
              <p className="text-xs text-gray-500">
                {t("common.subPlanLabel")}
                {entry.planTitle}
              </p>
            )}
          </div>
          {showMenu && (
            <PlanDetailActionsMenu
              items={menuItems}
              disabled={menuDisabled}
              menuClassName={cn(
                "rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900",
                menuClassName,
              )}
            />
          )}
        </div>
      )}

      {editMode === null && fullContent && (
        <div
          className={cn(
            "text-sm text-gray-600 transition-[max-height] duration-300 ease-out dark:text-gray-400",
            !expanded && needsExpand && "line-clamp-3",
          )}
        >
          <ContributionMarkdown
            content={expanded ? fullContent : fullContent.slice(0, PREVIEW_CHAR_LIMIT)}
          />
        </div>
      )}

      {editMode === null && entry.imageUrls && entry.imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {entry.imageUrls.slice(0, expanded ? undefined : 3).map((url) => (
            <UploadImage key={url} src={url} alt="" className="h-16 w-16 rounded object-cover" />
          ))}
          {!expanded && entry.imageUrls.length > 3 && (
            <span className="self-center text-xs text-gray-400">+{entry.imageUrls.length - 3}</span>
          )}
        </div>
      )}

      {editMode === null && needsExpand && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-brand-600 hover:text-brand-700"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? t("gantt.contributionDrawer.showLess") : t("gantt.contributionDrawer.showMore")}
        </Button>
      )}

      {editMode === "content" && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {saveError && <ErrorMessage message={saveError} />}
          <ContributionEditor
            values={editorValues}
            onChange={(patch) => setEditorValues((prev) => ({ ...prev, ...patch }))}
            mode="compact"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSaveContent()}>
              {saving ? t("gantt.contributionDrawer.saving") : t("common.save")}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={cancelEdit}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}

      {editMode === "plan" && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {saveError && <ErrorMessage message={saveError} />}
          <p className="mb-3 text-xs text-gray-400">{t("gantt.contributionDrawer.planHint")}</p>
          <ContributionPlanSelect
            currentPlanId={entry.planId}
            value={planId}
            onChange={setPlanId}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSavePlan()}>
              {saving ? t("gantt.contributionDrawer.saving") : t("common.save")}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={cancelEdit}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
