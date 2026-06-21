"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import { DrawerPanel } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ErrorMessage, Loading } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui";
import { ContributionPlanSelect } from "@/components/forms/contribution-plan-select";

interface ContributionDetail {
  id: string;
  planId: string;
  planTitle?: string;
  title: string;
  description: string | null;
  occurredOn: string;
  occurredEndOn?: string | null;
  plan?: { id: string; title: string; type: string };
}

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [planId, setPlanId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [occurredEndOn, setOccurredEndOn] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setItem(null);
    setEditing(false);

    fetch(`/api/contributions/${contributionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.contribution) {
          setError("记录不存在");
          return;
        }
        setItem(data.contribution);
        setPlanId(data.contribution.planId);
        setTitle(data.contribution.title);
        setDescription(data.contribution.description ?? "");
        setOccurredOn(data.contribution.occurredOn);
        setOccurredEndOn(data.contribution.occurredEndOn ?? data.contribution.occurredOn);
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

  async function handleSave() {
    if (!item) return;
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/contributions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          title: title.trim(),
          description: description.trim() || null,
          occurredOn,
          occurredEndOn: occurredEndOn || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "保存失败");
        return;
      }
      const detailRes = await fetch(`/api/contributions/${item.id}`);
      const detailData = await detailRes.json();
      if (detailRes.ok && detailData.contribution) {
        setItem(detailData.contribution);
        setPlanId(detailData.contribution.planId);
        setTitle(detailData.contribution.title);
        setDescription(detailData.contribution.description ?? "");
        setOccurredOn(detailData.contribution.occurredOn);
        setOccurredEndOn(
          detailData.contribution.occurredEndOn ?? detailData.contribution.occurredOn,
        );
      } else {
        setItem({ ...item, ...data.contribution, plan: item.plan });
      }
      setEditing(false);
      onUpdated?.();
      dispatchPlanUpdated();
    } catch {
      setSaveError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  const planTitle = item?.plan?.title ?? item?.planTitle ?? "计划";

  return (
    <DrawerPanel title={item?.title ?? "贡献详情"} onClose={onClose}>
      {loading && <Loading label="加载贡献…" />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && item && !editing && (
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
            <p className="mt-1 text-xs text-gray-400">
              要改到其它子计划，请点「修改所属计划」，不要改计划的父计划。
            </p>
          </div>
          {item.description && (
            <div>
              <p className="text-xs text-gray-500">详情</p>
              <p className="whitespace-pre-wrap text-gray-800">{item.description}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => setEditing(true)}>
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
      {!loading && item && editing && (
        <div className="space-y-4">
          {saveError && <ErrorMessage message={saveError} />}
          <ContributionPlanSelect
            currentPlanId={item.planId}
            value={planId}
            onChange={setPlanId}
          />
          <Input
            label="标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="开始日期"
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              required
            />
            <Input
              label="结束日期"
              type="date"
              value={occurredEndOn}
              onChange={(e) => setOccurredEndOn(e.target.value)}
            />
          </div>
          <Textarea
            label="描述"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
              {saving ? "保存中…" : "保存"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setSaveError("");
                setPlanId(item.planId);
                setTitle(item.title);
                setDescription(item.description ?? "");
                setOccurredOn(item.occurredOn);
                setOccurredEndOn(item.occurredEndOn ?? item.occurredOn);
              }}
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </DrawerPanel>
  );
}
