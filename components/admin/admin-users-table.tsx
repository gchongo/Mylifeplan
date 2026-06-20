"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorMessage, Loading } from "@/components/ui/feedback";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  subscriptionCount: number;
  planCount: number;
}

export function AdminUsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "加载失败");
      return;
    }
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function toggleActive(user: UserRow) {
    setBusyId(user.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
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
      setBusyId(null);
    }
  }

  if (loading) return <Loading />;
  if (users.length === 0) {
    return <EmptyState title="暂无用户" description="注册后将出现在此列表。" />;
  }

  return (
    <div>
      {error && <ErrorMessage message={error} className="mb-4" />}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">邮箱</th>
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">角色</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">数据</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="text-brand-600 hover:underline">
                    {user.email}
                  </Link>
                </td>
                <td className="px-4 py-3">{user.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === "admin" ? "warning" : "info"}>{user.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.isActive ? "success" : "danger"}>
                    {user.isActive ? "正常" : "已禁用"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {user.planCount} 计划 · {user.subscriptionCount} 订阅
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant={user.isActive ? "danger" : "secondary"}
                    disabled={busyId === user.id}
                    onClick={() => toggleActive(user)}
                  >
                    {user.isActive ? "禁用" : "启用"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
