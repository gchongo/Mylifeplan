"use client";

import { useEffect, useState } from "react";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { DrawerPanel } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage, Loading } from "@/components/ui/feedback";
import { ContributionPlanSelect } from "@/components/forms/contribution-plan-select";
import { ContributionMarkdown } from "@/components/contributions/contribution-markdown";
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

interface ContributionDetail {
  id: string;
  planId: string;
  planTitle?: string;
  title: string;
  description: string | null;
  body: string | null;
  imageUrls: string[];
  occurredOn: string;
  occurredEndOn?: string | null;
  plan?: { id: string; title: string; type: string };
}

type EditMode = null | "content" | "plan";

const PREVIEW_CHAR_LIMIT = 300;

export function GanttContributionDrawerPanel({
  contributionId,
  onClose,
  onDeleted,
  onUpdated,
}: {
  contributionId: string;
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [item, setItem] = useState<ContributionDetail | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [planId, setPlanId] = useState("");
  const [editorValues, setEditorValues] = useState<ContributionEditorValues>({
    title: "",
    body: "",
    occurredOn: "",
    occurredEndOn: "",
    imageUrls: [],
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setItem(null);
    setEditMode(null);
    setExpanded(false);

    fetch(`/api/contributions/${contributionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.contribution) {
          setError("记录不存在");
          return;
        }
        applyItem(data.contribution);
      })
      .catch(() => {
        if (!cancelled) setError("加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contributionId]);

  function applyItem(detail: ContributionDetail) {
    setItem(detail);
    setPlanId(detail.planId);
    setEditorValues({
      title: detail.title,
      body: detail.body ?? detail.description ?? "",
      ...contributionValuesFromApi(detail),
      imageUrls: detail.imageUrls ?? [],
    });
  }

  async function handleDelete() {
    if (!item || !confirm(`确定删除贡献记录「${item.title}」？`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contributions/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.();
        dispatchPlanUpdated();
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveContent() {
    if (!item) return;
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/contributions/${item.id}`, {
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
      await reloadItem();
      setEditMode(null);
      onUpdated?.();
      dispatchPlanUpdated();
    } catch {
      setSaveError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePlan() {
    if (!item) return;
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/contributions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "保存失败");
        return;
      }
      await reloadItem();
      setEditMode(null);
      onUpdated?.();
      dispatchPlanUpdated();
    } catch {
      setSaveError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function reloadItem() {
    const detailRes = await fetch(`/api/contributions/${contributionId}`);
    const detailData = await detailRes.json();
    if (detailRes.ok && detailData.contribution) {
      applyItem(detailData.contribution);
    }
  }

  function cancelEdit() {
    if (item) applyItem(item);
    setEditMode(null);
    setSaveError("");
  }

  const planTitle = item?.plan?.title ?? item?.planTitle ?? "计划";
  const displayBody = item?.body ?? item?.description ?? "";
  const dateLabel =
    item?.occurredEndOn && item.occurredEndOn !== item.occurredOn
      ? `${formatPlanDateTimeDisplay(item.occurredOn)} ~ ${formatPlanDateTimeDisplay(item.occurredEndOn)}`
      : item
        ? formatPlanDateTimeDisplay(item.occurredOn)
        : "";
  const needsExpand = displayBody.length > PREVIEW_CHAR_LIMIT;
  const menuDisabled = saving || deleting;

  const menuItems = [
    {
      id: "edit",
      label: "编辑内容",
      icon: <MenuIconEdit />,
      onClick: () => {
        if (item) applyItem(item);
        setEditMode("content");
      },
    },
    {
      id: "plan",
      label: "修改所属计划",
      icon: <MenuIconSubPlan />,
      onClick: () => {
        if (item) applyItem(item);
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
    <DrawerPanel onClose={onClose} className="p-0">
      {loading && (
        <div className="p-4">
          <Loading label="加载贡献…" />
        </div>
      )}
      {!loading && error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
      {!loading && item && (
        <div className="p-4">
          <Card>
            <CardHeader className="flex flex-row items-start gap-2 border-b-0 pb-0 pt-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base font-semibold leading-6">{item.title}</CardTitle>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{dateLabel}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">所属计划：{planTitle}</p>
              </div>
              <PlanDetailActionsMenu
                items={menuItems}
                disabled={menuDisabled}
                menuClassName="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="关闭"
                className="shrink-0 px-2"
              >
                ✕
              </Button>
            </CardHeader>

            <CardContent className="space-y-3 pt-2 text-sm text-gray-700 dark:text-gray-300">
              {editMode === null && displayBody && (
                <div
                  className={cn(
                    "leading-relaxed text-gray-700 dark:text-gray-300",
                    !expanded && needsExpand && "line-clamp-6",
                  )}
                >
                  <ContributionMarkdown
                    content={expanded ? displayBody : displayBody.slice(0, PREVIEW_CHAR_LIMIT)}
                  />
                </div>
              )}

              {editMode === null && item.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.imageUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="" className="max-h-48 rounded-lg object-cover" />
                  ))}
                </div>
              )}

              {editMode === null && !displayBody && item.imageUrls.length === 0 && (
                <p className="text-xs text-gray-400">暂无详细记录，可通过菜单「编辑内容」补充。</p>
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
                    <Button
                      type="button"
                      size="sm"
                      disabled={saving}
                      onClick={() => void handleSaveContent()}
                    >
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
                    currentPlanId={item.planId}
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
            </CardContent>
          </Card>
        </div>
      )}
    </DrawerPanel>
  );
}
