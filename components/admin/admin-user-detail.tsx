"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage, Loading } from "@/components/ui/feedback";

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  stats: { tasks: number; plans: number; memos: number };
  subscriptions: Array<{
    id: string;
    planName: string;
    status: string;
    paymentStatus: string;
    startAt: string;
    endAt: string;
  }>;
}

export function AdminUserDetail({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/users/${userId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "加载失败");
      return;
    }
    setUser(data.user);
  }, [userId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function toggleActive() {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "操作失败");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;
  if (!user) return <ErrorMessage message={error || "用户不存在"} />;

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>{user.email}</CardTitle>
            <p className="mt-1 text-sm text-gray-500">{user.name ?? "未设置名称"}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={user.role === "admin" ? "warning" : "info"}>{user.role}</Badge>
            <Badge variant={user.isActive ? "success" : "danger"}>
              {user.isActive ? "正常" : "已禁用"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-gray-500">
            注册于 {new Date(user.createdAt).toLocaleString()} · {user.stats.tasks} 任务 ·{" "}
            {user.stats.plans} 计划 · {user.stats.memos} 备忘录
          </p>
          <Button
            size="sm"
            variant={user.isActive ? "danger" : "secondary"}
            onClick={toggleActive}
            disabled={busy}
          >
            {user.isActive ? "禁用账号" : "启用账号"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">订阅记录</CardTitle>
        </CardHeader>
        <CardContent>
          {user.subscriptions.length === 0 ? (
            <p className="text-sm text-gray-500">暂无订阅。</p>
          ) : (
            <ul className="space-y-2">
              {user.subscriptions.map((sub) => (
                <li
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{sub.planName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(sub.startAt).toLocaleDateString()} →{" "}
                      {new Date(sub.endAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={sub.status === "active" ? "success" : "warning"}>
                      {sub.status}
                    </Badge>
                    <span className="text-gray-500">{sub.paymentStatus}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/subscriptions"
            className="mt-3 inline-block text-sm text-brand-600 hover:underline"
          >
            前往订阅管理 →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
