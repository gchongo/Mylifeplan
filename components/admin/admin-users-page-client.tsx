"use client";

import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { useI18n } from "@/components/i18n/i18n-provider";

export function AdminUsersPageClient() {
  const { t } = useI18n();

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">{t("admin.users")}</h1>
      <p className="mb-4 text-sm text-gray-500">{t("admin.usersIntro")}</p>
      <AdminUsersTable />
    </>
  );
}
