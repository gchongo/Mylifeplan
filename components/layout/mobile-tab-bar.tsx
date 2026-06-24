"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HomeTab } from "@/types";
import { useI18n } from "@/components/i18n/i18n-provider";

const tabs: { id: HomeTab; labelKey: "mobile.feed" | "mobile.summary" | "mobile.calendar"; href: string }[] = [
  { id: "feed", labelKey: "mobile.feed", href: "/?tab=feed" },
  { id: "summary", labelKey: "mobile.summary", href: "/?tab=summary" },
  { id: "calendar", labelKey: "mobile.calendar", href: "/?tab=calendar" },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const isHome = pathname === "/";

  if (!isHome) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden dark:border-gray-800 dark:bg-gray-950">
      <div className="grid grid-cols-3">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className="flex flex-col items-center py-2.5 text-xs text-gray-600 hover:text-brand-600 dark:text-gray-400"
          >
            <span className="text-base">
              {tab.id === "feed" ? "📋" : tab.id === "summary" ? "📊" : "📅"}
            </span>
            {t(tab.labelKey)}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function MobileHomeTabs({
  active,
  onChange,
}: {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mb-0 flex rounded-lg border border-gray-200 bg-gray-50 p-1 lg:hidden dark:border-gray-800 dark:bg-gray-900">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            active === tab.id ? "bg-white text-brand-700 shadow-sm dark:bg-gray-800 dark:text-brand-300" : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}
