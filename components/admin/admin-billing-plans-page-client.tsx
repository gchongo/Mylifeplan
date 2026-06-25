"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage, Loading } from "@/components/ui/feedback";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatBytes } from "@/lib/format-bytes";

interface BillingPlanRow {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  maxPlans: number | null;
  maxStorageBytes: number;
  maxFileBytes: number;
  isActive: boolean;
  sortOrder: number;
}

function bytesToMbInput(bytes: number): string {
  return String(Math.round((bytes / (1024 * 1024)) * 10) / 10);
}

function mbInputToBytes(mb: string): number {
  const n = Number.parseFloat(mb);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 1024 * 1024);
}

export function AdminBillingPlansPageClient() {
  const { t } = useI18n();
  const [plans, setPlans] = useState<BillingPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, BillingPlanRow>>({});

  async function load() {
    const res = await fetch("/api/admin/billing-plans");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t("common.loadFailed"));
      return;
    }
    const rows: BillingPlanRow[] = data.plans ?? [];
    setPlans(rows);
    setDrafts(Object.fromEntries(rows.map((p) => [p.id, { ...p }])));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  function updateDraft(id: string, patch: Partial<BillingPlanRow>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function save(planId: string) {
    const draft = drafts[planId];
    if (!draft) return;
    setSavingId(planId);
    setError("");
    try {
      const res = await fetch(`/api/admin/billing-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameZh: draft.nameZh,
          nameEn: draft.nameEn,
          maxPlans: draft.maxPlans,
          maxStorageBytes: draft.maxStorageBytes,
          maxFileBytes: draft.maxFileBytes,
          isActive: draft.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.saveFailed"));
        return;
      }
      await load();
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{t("admin.plans.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("admin.plans.intro")}</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="space-y-4">
        {plans.map((plan) => {
          const draft = drafts[plan.id] ?? plan;
          return (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {plan.slug}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {t("admin.plans.slugHint")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Input
                  label={t("admin.plans.nameZh")}
                  value={draft.nameZh}
                  onChange={(e) => updateDraft(plan.id, { nameZh: e.target.value })}
                />
                <Input
                  label={t("admin.plans.nameEn")}
                  value={draft.nameEn}
                  onChange={(e) => updateDraft(plan.id, { nameEn: e.target.value })}
                />
                <Input
                  label={t("admin.plans.maxPlans")}
                  type="number"
                  min={0}
                  placeholder={t("admin.plans.unlimitedPlaceholder")}
                  value={draft.maxPlans ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    updateDraft(plan.id, {
                      maxPlans: raw === "" ? null : Number.parseInt(raw, 10),
                    });
                  }}
                />
                <Input
                  label={t("admin.plans.maxStorageMb")}
                  type="number"
                  min={0}
                  step={0.1}
                  value={bytesToMbInput(draft.maxStorageBytes)}
                  onChange={(e) =>
                    updateDraft(plan.id, { maxStorageBytes: mbInputToBytes(e.target.value) })
                  }
                />
                <Input
                  label={t("admin.plans.maxFileMb")}
                  type="number"
                  min={0}
                  step={0.1}
                  value={bytesToMbInput(draft.maxFileBytes)}
                  onChange={(e) =>
                    updateDraft(plan.id, { maxFileBytes: mbInputToBytes(e.target.value) })
                  }
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) => updateDraft(plan.id, { isActive: e.target.checked })}
                  />
                  {t("admin.plans.isActive")}
                </label>
                <p className="sm:col-span-2 text-xs text-gray-500">
                  {t("admin.plans.currentSummary", {
                    plans:
                      draft.maxPlans == null
                        ? t("admin.plans.unlimitedPlans")
                        : String(draft.maxPlans),
                    storage: formatBytes(draft.maxStorageBytes),
                    file: formatBytes(draft.maxFileBytes),
                  })}
                </p>
                <div className="sm:col-span-2">
                  <Button size="sm" onClick={() => save(plan.id)} disabled={savingId === plan.id}>
                    {savingId === plan.id ? t("common.saving") : t("common.save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
