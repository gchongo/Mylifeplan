"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui";
import { MemoMarkdown } from "@/components/memos/memo-markdown";
import { formatMemoCardDate, memoDisplayBody } from "@/lib/memo-content";
import { cn } from "@/lib/utils";

export interface MemoCardData {
  id: string;
  title: string;
  description: string | null;
  body: string | null;
  sourceType: "plan" | "standalone";
  createdAt: string;
  updatedAt: string;
  images: { id: string; url: string }[];
  comments: { id: string; body: string; createdAt: string }[];
}

interface MemoCardProps {
  memo: MemoCardData;
  onChanged: () => void;
  onError: (msg: string) => void;
}

export function MemoCard({ memo, onChanged, onError }: MemoCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [dateEditing, setDateEditing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayBody = memoDisplayBody(memo);
  const cardDate = formatMemoCardDate(memo.createdAt);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  function startEdit() {
    setMenuOpen(false);
    setEditing(true);
    setEditContent(displayBody === memo.title ? memo.title : `${memo.title}\n${displayBody}`);
  }

  async function saveEdit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      setEditing(false);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function addStartDate() {
    if (!startDate) {
      onError("请选择开始日期");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失败");
      setDateEditing(false);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "更新失败");
    } finally {
      setBusy(false);
    }
  }

  async function archiveMemo() {
    setMenuOpen(false);
    if (!confirm(`确定归档「${memo.title}」？`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "归档失败");
      }
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "归档失败");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMemo() {
    setMenuOpen(false);
    if (!confirm(`确定删除「${memo.title}」？`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "删除失败");
      }
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  async function submitComment() {
    const text = commentText.trim();
    if (!text) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "评论失败");
      setCommentText("");
      setShowComments(true);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "评论失败");
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(commentId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("删除失败");
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <header className="flex items-center justify-between px-4 pt-3">
        <time className="text-sm font-medium text-gray-700 dark:text-gray-300">{cardDate}</time>
        <div className="relative flex items-center gap-1" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className={cn(
              "rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800",
              showComments && "bg-gray-100 dark:bg-gray-800",
            )}
            title="评论"
            aria-label="评论"
          >
            <CommentIcon count={memo.comments.length} />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="更多操作"
          >
            <DotsIcon />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[8rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <MenuItem onClick={startEdit}>编辑</MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuOpen(false);
                  setDateEditing(true);
                }}
              >
                补充日期
              </MenuItem>
              <MenuItem onClick={archiveMemo}>归档</MenuItem>
              <MenuItem onClick={deleteMemo} danger>
                删除
              </MenuItem>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 py-3">
        {editing ? (
          <div className="space-y-3">
            <Textarea
              rows={6}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="支持 Markdown…"
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={busy} onClick={() => void saveEdit()}>
                保存
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
                取消
              </Button>
            </div>
          </div>
        ) : (
          <>
            <MemoMarkdown content={displayBody} />
            {memo.images.length > 0 && (
              <div
                className={cn(
                  "mt-3 grid gap-2",
                  memo.images.length === 1 ? "grid-cols-1" : "grid-cols-2",
                )}
              >
                {memo.images.map((img) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={img.id}
                    src={img.url}
                    alt=""
                    className="max-h-64 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </>
        )}

        {dateEditing && (
          <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            <Input
              label="开始日期"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Button size="sm" disabled={busy} onClick={() => void addStartDate()}>
              回流到日历
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setDateEditing(false)}>
              取消
            </Button>
          </div>
        )}
      </div>

      {(showComments || memo.comments.length > 0) && (
        <footer className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <ul className="mb-3 space-y-2">
            {memo.comments.map((c) => (
              <li
                key={c.id}
                className="group flex items-start justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800/60"
              >
                <span className="text-gray-800 dark:text-gray-200">{c.body}</span>
                <button
                  type="button"
                  className="shrink-0 text-xs text-gray-400 opacity-0 hover:text-red-500 group-hover:opacity-100"
                  onClick={() => void deleteComment(c.id)}
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submitComment()}
              placeholder="写一条评论…"
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            <Button size="sm" disabled={busy || !commentText.trim()} onClick={() => void submitComment()}>
              发送
            </Button>
          </div>
        </footer>
      )}
    </article>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800",
        danger ? "text-red-600" : "text-gray-700 dark:text-gray-300",
      )}
    >
      {children}
    </button>
  );
}

function DotsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

function CommentIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-gray-500 px-0.5 text-[9px] text-white">
          {count}
        </span>
      )}
    </span>
  );
}
