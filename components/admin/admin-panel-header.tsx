"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { useI18n } from "@/components/i18n/i18n-provider";

const adminNav = [
  { href: "/admin/users", key: "admin.users" as const },
  { href: "/admin/subscriptions", key: "admin.subscriptions" as const },
];

export function AdminPanelHeader({ email }: { email: string }) {
  const { t } = useI18n();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-semibold text-gray-900">
            {t("admin.brand")}
          </Link>
          <nav className="hidden gap-4 sm:flex">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 sm:inline">{email}</span>
          <Link href="/" className="text-sm text-brand-600 hover:underline">
            {t("admin.backToApp")}
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
