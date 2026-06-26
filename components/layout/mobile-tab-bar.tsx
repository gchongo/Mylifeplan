"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useMobileShell } from "@/hooks/use-mobile-shell";
import { shouldShowMobileTabBar, type MobileTabPath } from "@/lib/mobile-shell";
import { cn } from "@/lib/utils";

const tabs: { href: MobileTabPath; labelKey: "mobile.feed" | "mobile.gantt" | "mobile.calendar" | "mobile.kanban" | "mobile.memos"; icon: string }[] = [
  { href: "/feed", labelKey: "mobile.feed", icon: "≡" },
  { href: "/gantt", labelKey: "mobile.gantt", icon: "▬" },
  { href: "/calendar", labelKey: "mobile.calendar", icon: "▦" },
  { href: "/plans", labelKey: "mobile.kanban", icon: "◎" },
  { href: "/memos", labelKey: "mobile.memos", icon: "▤" },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const isMobileShell = useMobileShell();

  if (!shouldShowMobileTabBar(pathname, isMobileShell)) return null;

  return (
    <nav
      className="mobile-tab-bar fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-800 dark:bg-gray-950"
      aria-label={t("mobile.tabBarAria")}
    >
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                active
                  ? "font-medium text-brand-600 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              <span className="text-base leading-none" aria-hidden>
                {tab.icon}
              </span>
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
