"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui";
import { EmptyState, Loading, ErrorMessage } from "@/components/ui/feedback";

type EditMode = "date" | "content" | null;

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
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [startDate, setStartDate] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/memos");
    const data = await res.json();
    setMemos(data.memos ?? []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  function resetEdit() {
    setEditingId(null);
    setEditMode(null);
    setStartDate("");
    setEditTitle("");
    setEditDescription("");
  }

  function startDateEdit(memo: MemoRow) {
    setEditingId(memo.id);
    setEditMode("date");
    setStartDate("");
  }

  function startContentEdit(memo: MemoRow) {
    setEditingId(memo.id);
    setEditMode("content");
    setEditTitle(memo.title);
    setEditDescription(memo.description ?? "");
  }

  async function addStartDate(memoId: string) {
    setError("");
    if (!startDate) {
      setError("请选择开始日期");
      return;
    }
    setBusy(true);
    try {
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
      resetEdit();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function saveContent(memoId: string) {
    setError("");
    if (!editTitle.trim()) {
      setError("标题不能为空");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/memos/${memoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      resetEdit();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function archiveMemo(memoId: string, title: string) {
    if (!confirm(`确定归档「${title}」？归档后将从备忘录和首页视图中隐藏。`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/memos/${memoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "归档失败");
        return;
      }
      resetEdit();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function deleteMemo(memoId: string, title: string) {
    if (!confirm(`确定删除「${title}」？关联的任务/计划也会一并删除。`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/memos/${memoId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "删除失败");
        return;
      }
      resetEdit();
      await load();
    } finally {
      setBusy(false);
    }
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
            {editingId === memo.id && editMode === "content" ? (
              <div className="space-y-3">
                <Input
                  label="标题"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <Textarea
                  label="描述"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => saveContent(memo.id)} disabled={busy}>
                    保存
                  </Button>
                  <Button size="sm" variant="ghost" onClick={resetEdit} disabled={busy}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <>
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

                {editingId === memo.id && editMode === "date" ? (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <Input
                      label="补充开始日期"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Button size="sm" onClick={() => addStartDate(memo.id)} disabled={busy}>
                      回流到日历
                    </Button>
                    <Button size="sm" variant="ghost" onClick={resetEdit} disabled={busy}>
                      取消
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => startContentEdit(memo)}>
                      编辑
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => startDateEdit(memo)}>
                      补充日期
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => archiveMemo(memo.id, memo.title)}
                      disabled={busy}
                    >
                      归档
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMemo(memo.id, memo.title)}
                      disabled={busy}
                    >
                      删除
                    </Button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm text-gray-500">
        补充开始日期后，条目离开备忘录，出现在{" "}
        <Link href="/" className="text-brand-600 hover:underline">
          首页日历/甘特图
        </Link>
        。编辑标题/描述会同步到源任务或计划。
      </p>
    </div>
  );
}
