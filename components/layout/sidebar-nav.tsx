"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const sidebarNavItems = [
  { href: "/", label: "首页", icon: "⌂" },
  { href: "/feed", label: "信息流", icon: "≡" },
  { href: "/gantt", label: "甘特图", icon: "▬" },
  { href: "/calendar", label: "日历", icon: "▦" },
  { href: "/plans", label: "看板", icon: "◎" },
  { href: "/summary", label: "总结", icon: "◫" },
  { href: "/memos", label: "便签", icon: "▤" },
];

export function SidebarNavMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

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
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
              )}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      <Link
        href="/settings"
        onClick={onNavigate}
        className={cn(
          "mt-2 flex items-center gap-2 rounded-lg border-t border-gray-100 px-3 py-2 pt-3 text-sm transition-colors dark:border-gray-800",
          pathname === "/settings" || pathname.startsWith("/settings/")
            ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        )}
      >
        <span aria-hidden>⚙</span>
        设置
      </Link>
    </nav>
  );
}
