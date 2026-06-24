"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorMessage, Loading } from "@/components/ui/feedback";
import { useI18n } from "@/components/i18n/i18n-provider";

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
  const { t } = useI18n();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t("common.loadFailed"));
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
        setError(data.error ?? t("common.operationFailed"));
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Loading />;
  if (users.length === 0) {
    return <EmptyState title={t("admin.noUsers")} description={t("admin.noUsersHint")} />;
  }

  return (
    <div>
      {error && <ErrorMessage message={error} className="mb-4" />}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">{t("admin.table.email")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.table.name")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.table.role")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.table.status")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.table.data")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.table.actions")}</th>
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
                  <Badge variant={user.role === "admin" ? "warning" : "info"}>
                    {user.role === "admin" ? t("admin.roleAdmin") : t("admin.roleUser")}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.isActive ? "success" : "danger"}>
                    {user.isActive ? t("common.active") : t("common.inactive")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {t("admin.dataSummary", {
                    plans: user.planCount,
                    subs: user.subscriptionCount,
                  })}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant={user.isActive ? "danger" : "secondary"}
                    disabled={busyId === user.id}
                    onClick={() => toggleActive(user)}
                  >
                    {user.isActive ? t("common.disable") : t("common.enable")}
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
