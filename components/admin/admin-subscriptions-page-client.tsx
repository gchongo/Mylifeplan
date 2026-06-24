"use client";

import { AdminSubscriptionsTable } from "@/components/admin/admin-subscriptions-table";
import { useI18n } from "@/components/i18n/i18n-provider";

export function AdminSubscriptionsPageClient() {
  const { t } = useI18n();

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">{t("admin.subscriptions")}</h1>
      <p className="mb-4 text-sm text-gray-500">{t("admin.subscriptionsIntro")}</p>
      <AdminSubscriptionsTable />
    </>
  );
}
