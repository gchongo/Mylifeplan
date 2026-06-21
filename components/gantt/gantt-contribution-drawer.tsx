"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { DrawerPanel } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ErrorMessage, Loading } from "@/components/ui/feedback";
import { ContributionPlanSelect } from "@/components/forms/contribution-plan-select";
import { ContributionMarkdown } from "@/components/contributions/contribution-markdown";
import {
  ContributionEditor,
  type ContributionEditorValues,
} from "@/components/contributions/contribution-editor";

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
      occurredOn: detail.occurredOn,
      occurredEndOn: detail.occurredEndOn ?? detail.occurredOn,
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
  const displayBody = item?.body ?? item?.description;

  return (
    <DrawerPanel title={item?.title ?? "贡献详情"} onClose={onClose}>
      {loading && <Loading label="加载贡献…" />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && item && editMode === null && (
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">贡献日期</p>
            <p className="font-medium text-gray-900">
              {item.occurredEndOn && item.occurredEndOn !== item.occurredOn
                ? `${formatPlanDateTimeDisplay(item.occurredOn)} ~ ${formatPlanDateTimeDisplay(item.occurredEndOn)}`
                : formatPlanDateTimeDisplay(item.occurredOn)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">所属计划</p>
            <Link
              href={`/plans/${item.planId}`}
              className="font-medium text-brand-600 hover:underline"
            >
              {planTitle}
            </Link>
          </div>
          {displayBody && (
            <div>
              <p className="text-xs text-gray-500">执行记录</p>
              <ContributionMarkdown content={displayBody} />
            </div>
          )}
          {item.imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.imageUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="max-h-48 rounded-lg object-cover" />
              ))}
            </div>
          )}
          {!displayBody && item.imageUrls.length === 0 && (
            <p className="text-xs text-gray-400">暂无详细记录，可点击「编辑内容」补充。</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => setEditMode("content")}>
              编辑内容
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditMode("plan")}>
              修改所属计划
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "删除中…" : "删除记录"}
            </Button>
          </div>
        </div>
      )}
      {!loading && item && editMode === "content" && (
        <div className="space-y-4">
          {saveError && <ErrorMessage message={saveError} />}
          <ContributionEditor
            values={editorValues}
            onChange={(patch) => setEditorValues((prev) => ({ ...prev, ...patch }))}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSaveContent()}>
              {saving ? "保存中…" : "保存"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={cancelEdit}>
              取消
            </Button>
          </div>
        </div>
      )}
      {!loading && item && editMode === "plan" && (
        <div className="space-y-4">
          {saveError && <ErrorMessage message={saveError} />}
          <p className="text-xs text-gray-400">
            要改到其它子计划，请在此选择，不要改计划的父计划。
          </p>
          <ContributionPlanSelect
            currentPlanId={item.planId}
            value={planId}
            onChange={setPlanId}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSavePlan()}>
              {saving ? "保存中…" : "保存"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={cancelEdit}>
              取消
            </Button>
          </div>
        </div>
      )}
    </DrawerPanel>
  );
}
