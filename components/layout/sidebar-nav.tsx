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

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function SidebarNav({
  open,
  onToggle,
  onNavigate,
}: {
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col">
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-gray-100",
          open ? "gap-2 p-3" : "justify-center p-2",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
          aria-label={open ? "收起导航" : "展开导航"}
          aria-expanded={open}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        {open && (
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-brand-700">MyLifePlan</p>
            <p className="truncate text-xs text-gray-500">个人规划系统</p>
          </div>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-1 overflow-y-auto p-3">
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
        </div>
      )}
    </nav>
  );
}
