"use client";

import { useState } from "react";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { ContributionMarkdown } from "@/components/contributions/contribution-markdown";
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

export interface PlanContributionItem {
  id: string;
  planId: string;
  planTitle?: string;
  title: string;
  description?: string | null;
  body?: string | null;
  imageUrls?: string[];
  occurredOn: string;
  occurredEndOn?: string | null;
}

const PREVIEW_CHAR_LIMIT = 300;

type EditMode = null | "content" | "plan";

function editorValuesFromEntry(entry: PlanContributionItem): ContributionEditorValues {
  return {
    title: entry.title,
    body: entry.body ?? entry.description ?? "",
    ...contributionValuesFromApi(entry),
    imageUrls: entry.imageUrls ?? [],
  };
}

function TimelineContributionEntry({
  entry,
  currentPlanId,
  onChanged,
}: {
  entry: PlanContributionItem;
  currentPlanId: string;
  onChanged?: () => void;
}) {
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
  const isOtherPlan = entry.planId !== currentPlanId;
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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "保存失败");
        return;
      }
      setEditMode(null);
      onChanged?.();
      dispatchPlanUpdated();
    } catch {
      setSaveError("网络错误");
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
        setSaveError(data.error ?? "保存失败");
        return;
      }
      setEditMode(null);
      onChanged?.();
      dispatchPlanUpdated();
    } catch {
      setSaveError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`确定删除贡献记录「${entry.title}」？`)) return;
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
      label: "编辑内容",
      icon: <MenuIconEdit />,
      onClick: () => {
        resetEditor();
        setEditMode("content");
      },
    },
    {
      id: "plan",
      label: "修改所属计划",
      icon: <MenuIconSubPlan />,
      onClick: () => {
        resetEditor();
        setEditMode("plan");
      },
    },
    {
      id: "delete",
      label: "删除记录",
      icon: <MenuIconDelete />,
      destructive: true,
      onClick: () => void handleDelete(),
    },
  ];

  return (
    <li className="relative pb-6 last:pb-0">
      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">{entry.title}</span>
              <span className="text-xs text-gray-400">{dateLabel}</span>
            </div>
            {isOtherPlan && entry.planTitle && (
              <p className="text-xs text-gray-500">子计划：{entry.planTitle}</p>
            )}
          </div>
          <PlanDetailActionsMenu
            items={menuItems}
            disabled={menuDisabled}
            menuClassName="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
          />
        </div>

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
          <div className="flex gap-1 pt-1">
            {entry.imageUrls.slice(0, expanded ? undefined : 3).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="h-10 w-10 rounded object-cover" />
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
            {expanded ? "收起" : "查看更多"}
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
                {saving ? "保存中…" : "保存"}
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={cancelEdit}>
                取消
              </Button>
            </div>
          </div>
        )}

        {editMode === "plan" && (
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {saveError && <ErrorMessage message={saveError} />}
            <p className="mb-3 text-xs text-gray-400">
              要改到其它子计划，请在此选择，不要改计划的父计划。
            </p>
            <ContributionPlanSelect
              currentPlanId={entry.planId}
              value={planId}
              onChange={setPlanId}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={saving} onClick={() => void handleSavePlan()}>
                {saving ? "保存中…" : "保存"}
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={cancelEdit}>
                取消
              </Button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

export function PlanContributionTimeline({
  contributions,
  currentPlanId,
  onChanged,
}: {
  contributions: PlanContributionItem[];
  currentPlanId: string;
  onChanged?: () => void;
}) {
  if (contributions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">执行时间线</CardTitle>
        <p className="text-xs text-gray-500">
          共 {contributions.length} 条记录，按计划执行顺序排列
        </p>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-0 border-l border-gray-200 pl-4 dark:border-gray-700">
          {contributions.map((entry) => (
            <TimelineContributionEntry
              key={entry.id}
              entry={entry}
              currentPlanId={currentPlanId}
              onChanged={onChanged}
            />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
