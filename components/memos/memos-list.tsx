"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, Loading, ErrorMessage } from "@/components/ui/feedback";

interface MemoRow {
  id: string;
  title: string;
  description: string | null;
  sourceType: "task" | "plan";
  updatedAt: string;
}

export function MemosList() {
  const [memos, setMemos] = useState<MemoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");

  async function load() {
    const res = await fetch("/api/memos");
    const data = await res.json();
    setMemos(data.memos ?? []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function addStartDate(memoId: string) {
    setError("");
    if (!startDate) {
      setError("请选择开始日期");
      return;
    }
    const res = await fetch(`/api/memos/${memoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "更新失败");
      return;
    }
    setEditingId(null);
    setStartDate("");
    await load();
  }

  if (loading) return <Loading />;

  if (memos.length === 0) {
    return (
      <EmptyState
        title="备忘录为空"
        description="创建无日期的任务或计划后，会自动出现在这里。"
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <ul className="space-y-3">
        {memos.map((memo) => (
          <li
            key={memo.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{memo.title}</p>
                {memo.description && (
                  <p className="mt-1 text-sm text-gray-500">{memo.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  来源：{memo.sourceType === "task" ? "任务" : "计划"}
                </p>
              </div>
            </div>
            {editingId === memo.id ? (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Input
                  label="补充开始日期"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Button size="sm" onClick={() => addStartDate(memo.id)}>
                  回流到日历
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  取消
                </Button>
              </div>
            ) : (
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onClick={() => setEditingId(memo.id)}
              >
                补充日期
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm text-gray-500">
        补充开始日期后，条目离开备忘录，出现在{" "}
        <Link href="/" className="text-brand-600 hover:underline">
          首页日历/甘特图
        </Link>
        。
      </p>
    </div>
  );
}
