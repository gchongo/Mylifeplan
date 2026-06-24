"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui";
import { PlanDateTimeField } from "@/components/forms/plan-datetime-field";
import { EmptyState, ErrorMessage, Loading } from "@/components/ui/feedback";
import { toDatetimeLocalInput, datetimeLocalToIso } from "@/lib/dates";

interface SubscriptionRow {
  id: string;
  userEmail: string | null;
  userName: string | null;
  planName: string;
  status: string;
  paymentStatus: string;
  startAt: string;
  endAt: string;
}

const statusOptions = [
  { value: "active", label: "active" },
  { value: "expired", label: "expired" },
  { value: "cancelled", label: "cancelled" },
];

const paymentOptions = [
  { value: "pending", label: "pending" },
  { value: "paid", label: "paid" },
  { value: "failed", label: "failed" },
];

export function AdminSubscriptionsTable() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    planName: "",
    status: "active",
    paymentStatus: "paid",
    startAt: "",
    endAt: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/subscriptions");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "加载失败");
      return;
    }
    setSubs(data.subscriptions ?? []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  function startEdit(sub: SubscriptionRow) {
    setEditingId(sub.id);
    setForm({
      planName: sub.planName,
      status: sub.status,
      paymentStatus: sub.paymentStatus,
      startAt: toDatetimeLocalInput(sub.startAt),
      endAt: toDatetimeLocalInput(sub.endAt),
    });
  }

  async function save() {
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/subscriptions/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: form.planName,
          status: form.status,
          paymentStatus: form.paymentStatus,
          startAt: datetimeLocalToIso(form.startAt) ?? new Date(form.startAt).toISOString(),
          endAt: datetimeLocalToIso(form.endAt) ?? new Date(form.endAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (subs.length === 0) {
    return <EmptyState title="暂无订阅" description="用户订阅记录将显示在此。" />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 font-medium">套餐</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">支付</th>
              <th className="px-4 py-3 font-medium">有效期</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((sub) => (
              <tr key={sub.id} className="border-b border-gray-100 last:border-0 align-top">
                <td className="px-4 py-3">
                  <p>{sub.userEmail ?? "—"}</p>
                  {sub.userName && <p className="text-xs text-gray-400">{sub.userName}</p>}
                </td>
                <td className="px-4 py-3">{sub.planName}</td>
                <td className="px-4 py-3">
                  <Badge variant={sub.status === "active" ? "success" : "warning"}>{sub.status}</Badge>
                </td>
                <td className="px-4 py-3">{sub.paymentStatus}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(sub.startAt).toLocaleDateString()} →{" "}
                  {new Date(sub.endAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(sub)}>
                    编辑
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-medium">编辑订阅</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="套餐名称"
              value={form.planName}
              onChange={(e) => setForm({ ...form, planName: e.target.value })}
            />
            <Select
              label="订阅状态"
              options={statusOptions}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
            <Select
              label="支付状态"
              options={paymentOptions}
              value={form.paymentStatus}
              onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
            />
            <PlanDateTimeField
              label="开始时间"
              value={form.startAt}
              onConfirm={(startAt) => setForm({ ...form, startAt })}
              edge="start"
            />
            <PlanDateTimeField
              label="结束时间"
              value={form.endAt}
              onConfirm={(endAt) => setForm({ ...form, endAt })}
              edge="end"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
