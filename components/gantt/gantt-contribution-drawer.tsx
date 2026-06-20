"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DrawerPanel } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/feedback";

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
}: {
  contributionId: string;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [item, setItem] = useState<ContributionDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setItem(null);

    fetch(`/api/contributions/${contributionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.contribution) {
          setError("记录不存在");
          return;
        }
        setItem(data.contribution);
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
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  const planTitle = item?.plan?.title ?? item?.planTitle ?? "计划";

  return (
    <DrawerPanel title={item?.title ?? "贡献详情"} onClose={onClose}>
      {loading && <Loading label="加载贡献…" />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && item && (
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">贡献日期</p>
            <p className="font-medium text-gray-900">
              {item.occurredEndOn && item.occurredEndOn !== item.occurredOn
                ? `${item.occurredOn} ~ ${item.occurredEndOn}`
                : item.occurredOn}
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
          {item.description && (
            <div>
              <p className="text-xs text-gray-500">详情</p>
              <p className="whitespace-pre-wrap text-gray-800">{item.description}</p>
            </div>
          )}
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
      )}
    </DrawerPanel>
  );
}
