"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage, Loading } from "@/components/ui/feedback";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatBytes } from "@/lib/format-bytes";

interface Overview {
  userCount: number;
  activeUserCount: number;
  subscriptionCount: number;
  expiringSoon: number;
  todayRegistered: number;
  billingPlans: Array<{
    id: string;
    slug: string;
    nameZh: string;
    maxPlans: number | null;
    maxStorageBytes: number;
    isActive: boolean;
  }>;
}

export function AdminDashboardPageClient() {
  const { t } = useI18n();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((res) => res.json())
      .then((data) => {
        if (!data.overview) {
          setError(data.error ?? t("common.loadFailed"));
          return;
        }
        setOverview(data.overview);
      })
      .catch(() => setError(t("common.networkError")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <Loading />;
  if (!overview) return <ErrorMessage message={error || t("common.loadFailed")} />;

  const stats = [
    { label: t("admin.overview.totalUsers"), value: overview.userCount },
    { label: t("admin.overview.activeUsers"), value: overview.activeUserCount },
    { label: t("admin.overview.activeSubscriptions"), value: overview.subscriptionCount },
    { label: t("admin.overview.expiringSoon"), value: overview.expiringSoon },
    { label: t("admin.overview.todayRegistered"), value: overview.todayRegistered },
  ];

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{t("admin.overview.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("admin.overview.intro")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("admin.overview.plansTitle")}</CardTitle>
          <Link href="/admin/plans" className="text-sm text-brand-600 hover:underline">
            {t("admin.overview.managePlans")}
          </Link>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {overview.billingPlans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2"
              >
                <div>
                  <span className="font-medium">{plan.nameZh}</span>
                  <span className="ml-2 text-xs text-gray-400">{plan.slug}</span>
                  {!plan.isActive && (
                    <span className="ml-2 text-xs text-amber-600">{t("admin.plans.inactive")}</span>
                  )}
                </div>
                <span className="text-gray-500">
                  {plan.maxPlans == null
                    ? t("admin.plans.unlimitedPlans")
                    : t("admin.plans.maxPlansLabel", { count: plan.maxPlans })}
                  {" · "}
                  {formatBytes(plan.maxStorageBytes)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/users" className="text-brand-600 hover:underline">
          {t("admin.users")} →
        </Link>
        <Link href="/admin/subscriptions" className="text-brand-600 hover:underline">
          {t("admin.subscriptions")} →
        </Link>
      </div>
    </div>
  );
}
