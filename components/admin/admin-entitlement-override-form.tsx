"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/feedback";
import { useI18n } from "@/components/i18n/i18n-provider";

interface OverrideState {
  maxPlans: string;
  maxStorageMb: string;
  maxFileMb: string;
  reason: string;
}

function mbFromBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "";
  return String(Math.round((bytes / (1024 * 1024)) * 10) / 10);
}

function mbToBytes(mb: string): number | null {
  const raw = mb.trim();
  if (!raw) return null;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 1024 * 1024);
}

export function AdminEntitlementOverrideForm({
  userId,
  initial,
  onSaved,
}: {
  userId: string;
  initial: {
    maxPlans: number | null;
    maxStorageBytes: number | null;
    maxFileBytes: number | null;
    reason: string | null;
  } | null;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<OverrideState>({
    maxPlans: initial?.maxPlans != null ? String(initial.maxPlans) : "",
    maxStorageMb: mbFromBytes(initial?.maxStorageBytes),
    maxFileMb: mbFromBytes(initial?.maxFileBytes),
    reason: initial?.reason ?? "",
  });

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/entitlement-override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxPlans: form.maxPlans.trim() === "" ? null : Number.parseInt(form.maxPlans, 10),
          maxStorageBytes: mbToBytes(form.maxStorageMb),
          maxFileBytes: mbToBytes(form.maxFileMb),
          reason: form.reason.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.saveFailed"));
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function clearOverride() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/entitlement-override`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.operationFailed"));
        return;
      }
      setForm({ maxPlans: "", maxStorageMb: "", maxFileMb: "", reason: "" });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("admin.override.title")}</CardTitle>
        <p className="mt-1 text-sm font-normal text-gray-500">{t("admin.override.intro")}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <ErrorMessage message={error} />}
        <Input
          label={t("admin.override.maxPlans")}
          type="number"
          min={0}
          placeholder={t("admin.plans.unlimitedPlaceholder")}
          value={form.maxPlans}
          onChange={(e) => setForm({ ...form, maxPlans: e.target.value })}
        />
        <Input
          label={t("admin.override.maxStorageMb")}
          type="number"
          min={0}
          step={0.1}
          placeholder={t("admin.override.inheritPlaceholder")}
          value={form.maxStorageMb}
          onChange={(e) => setForm({ ...form, maxStorageMb: e.target.value })}
        />
        <Input
          label={t("admin.override.maxFileMb")}
          type="number"
          min={0}
          step={0.1}
          placeholder={t("admin.override.inheritPlaceholder")}
          value={form.maxFileMb}
          onChange={(e) => setForm({ ...form, maxFileMb: e.target.value })}
        />
        <Input
          label={t("admin.override.reason")}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? t("common.saving") : t("common.save")}
          </Button>
          <Button size="sm" variant="ghost" onClick={clearOverride} disabled={busy}>
            {t("admin.override.clear")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
