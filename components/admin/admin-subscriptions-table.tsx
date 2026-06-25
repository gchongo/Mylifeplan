"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui";
import { PlanDateTimeField } from "@/components/forms/plan-datetime-field";
import { EmptyState, ErrorMessage, Loading } from "@/components/ui/feedback";
import { useI18n } from "@/components/i18n/i18n-provider";
import { toDatetimeLocalInput, datetimeLocalToIso } from "@/lib/dates";

interface SubscriptionRow {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  billingPlanId: string | null;
  billingPlanSlug: string | null;
  planName: string;
  status: string;
  paymentStatus: string;
  startAt: string;
  endAt: string;
}

interface BillingPlanOption {
  id: string;
  nameZh: string;
  slug: string;
}

interface UserOption {
  id: string;
  email: string;
  name: string | null;
  subscriptionCount: number;
}

function defaultEndLocal(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return toDatetimeLocalInput(d.toISOString()) ?? "";
}

export function AdminSubscriptionsTable() {
  const { t } = useI18n();
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [billingPlans, setBillingPlans] = useState<BillingPlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: "",
    billingPlanId: "",
    status: "active",
    paymentStatus: "paid",
    startAt: toDatetimeLocalInput(new Date().toISOString()) ?? "",
    endAt: defaultEndLocal(),
  });
  const [form, setForm] = useState({
    billingPlanId: "",
    status: "active",
    paymentStatus: "paid",
    startAt: "",
    endAt: "",
  });
  const [saving, setSaving] = useState(false);

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

  const load = useCallback(async () => {
    const [subsRes, plansRes, usersRes] = await Promise.all([
      fetch("/api/admin/subscriptions"),
      fetch("/api/admin/billing-plans"),
      fetch("/api/admin/users"),
    ]);
    const data = await subsRes.json();
    const plansData = await plansRes.json();
    const usersData = await usersRes.json();
    if (!subsRes.ok) {
      setError(data.error ?? t("common.loadFailed"));
      return;
    }
    setSubs(data.subscriptions ?? []);
    const plans: BillingPlanOption[] = (plansData.plans ?? []).map(
      (p: BillingPlanOption & { isActive: boolean }) => ({
        id: p.id,
        nameZh: p.nameZh,
        slug: p.slug,
      }),
    );
    setBillingPlans(plans);
    setUsers(
      (usersData.users ?? []).map((u: UserOption) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        subscriptionCount: u.subscriptionCount,
      })),
    );
    const freePlan = plans.find((p) => p.slug === "free");
    setCreateForm((prev) => ({
      ...prev,
      billingPlanId: prev.billingPlanId || freePlan?.id || plans[0]?.id || "",
    }));
  }, [t]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const usersWithoutSub = users.filter((u) => u.subscriptionCount === 0);

  function startEdit(sub: SubscriptionRow) {
    setEditingId(sub.id);
    setCreating(false);
    setForm({
      billingPlanId: sub.billingPlanId ?? "",
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
          billingPlanId: form.billingPlanId || undefined,
          status: form.status,
          paymentStatus: form.paymentStatus,
          startAt: datetimeLocalToIso(form.startAt) ?? new Date(form.startAt).toISOString(),
          endAt: datetimeLocalToIso(form.endAt) ?? new Date(form.endAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.saveFailed"));
        return;
      }
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function createSubscription() {
    if (!createForm.userId || !createForm.billingPlanId) {
      setError(t("admin.selectUser"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: createForm.userId,
          billingPlanId: createForm.billingPlanId,
          status: createForm.status,
          paymentStatus: createForm.paymentStatus,
          startAt: datetimeLocalToIso(createForm.startAt) ?? new Date(createForm.startAt).toISOString(),
          endAt: datetimeLocalToIso(createForm.endAt) ?? new Date(createForm.endAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.createFailed"));
        return;
      }
      setCreating(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.email}${u.name ? ` (${u.name})` : ""}${u.subscriptionCount === 0 ? " · 0订阅" : ""}`,
  }));

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-medium text-gray-900">{t("admin.createSubscription")}</h3>
            <p className="mt-1 text-xs text-gray-500">{t("admin.createSubscriptionHint")}</p>
          </div>
          {!creating && (
            <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
              {t("admin.createSubscription")}
            </Button>
          )}
        </div>
        {usersWithoutSub.length > 0 && !creating && (
          <p className="text-sm text-amber-700">
            {usersWithoutSub.map((u) => u.email).join("、")} {t("admin.noSubscriptionYet")}
          </p>
        )}
        {creating && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Select
              label={t("admin.selectUser")}
              options={userOptions}
              value={createForm.userId}
              onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
            />
            <Select
              label={t("admin.table.plan")}
              options={billingPlans.map((p) => ({ value: p.id, label: `${p.nameZh} (${p.slug})` }))}
              value={createForm.billingPlanId}
              onChange={(e) => setCreateForm({ ...createForm, billingPlanId: e.target.value })}
            />
            <Select
              label={t("admin.subStatus")}
              options={statusOptions}
              value={createForm.status}
              onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
            />
            <Select
              label={t("admin.payStatus")}
              options={paymentOptions}
              value={createForm.paymentStatus}
              onChange={(e) => setCreateForm({ ...createForm, paymentStatus: e.target.value })}
            />
            <PlanDateTimeField
              label={t("admin.validFrom")}
              value={createForm.startAt}
              onConfirm={(startAt) => setCreateForm({ ...createForm, startAt })}
              edge="start"
            />
            <PlanDateTimeField
              label={t("admin.validTo")}
              value={createForm.endAt}
              onConfirm={(endAt) => setCreateForm({ ...createForm, endAt })}
              edge="end"
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button size="sm" onClick={createSubscription} disabled={saving}>
                {saving ? t("common.saving") : t("common.save")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {subs.length === 0 ? (
        <EmptyState title={t("admin.noSubscriptions")} description={t("admin.noSubscriptionsHint")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin.table.user")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.table.plan")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.table.status")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.table.payment")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.table.validity")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-100 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${sub.userId}`} className="hover:underline">
                      <p>{sub.userEmail ?? "—"}</p>
                    </Link>
                    {sub.userName && <p className="text-xs text-gray-400">{sub.userName}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {sub.planName}
                    {sub.billingPlanSlug && (
                      <span className="ml-1 text-xs text-gray-400">({sub.billingPlanSlug})</span>
                    )}
                  </td>
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
                      {t("admin.table.edit")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingId && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-medium">{t("admin.editSubscription")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label={t("admin.table.plan")}
              options={billingPlans.map((p) => ({ value: p.id, label: `${p.nameZh} (${p.slug})` }))}
              value={form.billingPlanId}
              onChange={(e) => setForm({ ...form, billingPlanId: e.target.value })}
            />
            <Select
              label={t("admin.subStatus")}
              options={statusOptions}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
            <Select
              label={t("admin.payStatus")}
              options={paymentOptions}
              value={form.paymentStatus}
              onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
            />
            <PlanDateTimeField
              label={t("admin.validFrom")}
              value={form.startAt}
              onConfirm={(startAt) => setForm({ ...form, startAt })}
              edge="start"
            />
            <PlanDateTimeField
              label={t("admin.validTo")}
              value={form.endAt}
              onConfirm={(endAt) => setForm({ ...form, endAt })}
              edge="end"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
