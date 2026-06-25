"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatBytes } from "@/lib/format-bytes";

interface Entitlements {
  planNameZh: string | null;
  planNameEn: string | null;
  planSlug: string | null;
  maxPlans: number | null;
  maxStorageBytes: number;
  usedPlans: number;
  usedStorageBytes: number;
  subscriptionEndAt: string | null;
}

export function SettingsSubscriptionSection() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<Entitlements | null>(null);

  useEffect(() => {
    fetch("/api/me/entitlements")
      .then((res) => res.json())
      .then((json) => setData(json.entitlements ?? null))
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const planName =
    locale === "en-US" && data.planNameEn ? data.planNameEn : data.planNameZh ?? data.planSlug ?? "—";
  const planLimit =
    data.maxPlans == null
      ? t("settings.subscription.unlimitedPlans")
      : `${data.usedPlans} / ${data.maxPlans}`;
  const storageLimit = `${formatBytes(data.usedStorageBytes)} / ${formatBytes(data.maxStorageBytes)}`;
  const planPct =
    data.maxPlans == null ? 0 : Math.min(100, (data.usedPlans / data.maxPlans) * 100);
  const storagePct = Math.min(100, (data.usedStorageBytes / data.maxStorageBytes) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("settings.subscription.title")}</CardTitle>
        <p className="mt-1 text-sm font-normal text-gray-500">{t("settings.subscription.intro")}</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">{t("settings.subscription.currentPlan")}</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{planName}</span>
        </div>
        {data.subscriptionEndAt && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">{t("settings.subscription.validUntil")}</span>
            <span>{new Date(data.subscriptionEndAt).toLocaleDateString()}</span>
          </div>
        )}
        <div>
          <div className="mb-1 flex justify-between text-gray-600 dark:text-gray-400">
            <span>{t("settings.subscription.planUsage")}</span>
            <span>{planLimit}</span>
          </div>
          {data.maxPlans != null && (
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${planPct}%` }}
              />
            </div>
          )}
        </div>
        <div>
          <div className="mb-1 flex justify-between text-gray-600 dark:text-gray-400">
            <span>{t("settings.subscription.storageUsage")}</span>
            <span>{storageLimit}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${storagePct}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
