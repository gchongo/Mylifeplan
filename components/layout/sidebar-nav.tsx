"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
  { href: "/", labelKey: "nav.home", icon: "⌂" },
  { href: "/feed", labelKey: "nav.feed", icon: "≡" },
  { href: "/gantt", labelKey: "nav.gantt", icon: "▬" },
  { href: "/calendar", labelKey: "nav.calendar", icon: "▦" },
  { href: "/plans", labelKey: "nav.plans", icon: "◎" },
  { href: "/memos", labelKey: "nav.memos", icon: "▤" },
  { href: "/summary", labelKey: "nav.summary", icon: "◫" },
] as const;

export function SidebarNavMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="sidebar-nav-menu flex h-full flex-col gap-1 overflow-y-auto p-3">
      <div className="flex flex-1 flex-col gap-1">
        {sidebarNavItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
              )}
            >
              <span
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-base leading-none"
                aria-hidden
              >
                {item.icon}
              </span>
              <span className="min-w-0 truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/settings"
        onClick={onNavigate}
        className={cn(
          "mt-2 flex items-center gap-2.5 rounded-lg border-t border-gray-100 px-3 py-2 pt-3 text-sm transition-colors dark:border-gray-800",
          pathname === "/settings" || pathname.startsWith("/settings/")
            ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        )}
      >
        <span
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-base leading-none"
          aria-hidden
        >
          ⚙
        </span>
        <span className="min-w-0 truncate">{t("nav.settings")}</span>
      </Link>
    </nav>
  );
}
