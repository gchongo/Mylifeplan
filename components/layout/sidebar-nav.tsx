"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const sidebarNavItems = [
  { href: "/", label: "首页", icon: "⌂" },
  { href: "/tasks", label: "任务", icon: "☑" },
  { href: "/plans/long", label: "长期规划", icon: "◎" },
  { href: "/plans/short", label: "短期计划", icon: "▦" },
  { href: "/memos", label: "备忘录", icon: "✎" },
];

export function SidebarNavMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav-menu flex h-full flex-col gap-1 overflow-y-auto p-3">
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
                ? "bg-brand-50 font-medium text-brand-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
