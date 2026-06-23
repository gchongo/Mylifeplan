"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HomeTab } from "@/types";

const tabs: { id: HomeTab; label: string; href: string }[] = [
  { id: "feed", label: "动态", href: "/?tab=feed" },
  { id: "summary", label: "总结", href: "/?tab=summary" },
  { id: "calendar", label: "执行", href: "/?tab=calendar" },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (!isHome) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
      <div className="grid grid-cols-3">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className="flex flex-col items-center py-2.5 text-xs text-gray-600 hover:text-brand-600"
          >
            <span className="text-base">
              {tab.id === "feed" ? "📋" : tab.id === "summary" ? "📊" : "📅"}
            </span>
            {tab.label}
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
  return (
    <div className="mb-4 flex rounded-lg border border-gray-200 bg-gray-50 p-1 lg:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            active === tab.id ? "bg-white text-brand-700 shadow-sm" : "text-gray-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
