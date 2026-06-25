"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", key: "admin.overview.nav" as const, exact: true },
  { href: "/admin/plans", key: "admin.plans.nav" as const },
  { href: "/admin/users", key: "admin.users" as const },
  { href: "/admin/subscriptions", key: "admin.subscriptions" as const },
];

export function AdminPanelHeader({ email }: { email: string }) {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/admin" className="shrink-0 font-semibold text-gray-900">
            {t("admin.brand")}
          </Link>
          <nav className="flex gap-2 overflow-x-auto sm:gap-4">
            {adminNav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap text-sm",
                    active ? "font-medium text-brand-700" : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
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
