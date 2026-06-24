"use client";

import Link from "next/link";
import { AdminUserDetail } from "@/components/admin/admin-user-detail";
import { useI18n } from "@/components/i18n/i18n-provider";

export function AdminUserDetailPageClient({ userId }: { userId: string }) {
  const { t } = useI18n();

  return (
    <>
      <Link href="/admin/users" className="text-sm text-brand-600 hover:underline">
        ← {t("admin.backToUsers")}
      </Link>
      <h1 className="mb-4 mt-2 text-xl font-semibold">{t("admin.userDetail")}</h1>
      <AdminUserDetail userId={userId} />
    </>
  );
}
