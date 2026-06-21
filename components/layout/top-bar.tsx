"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { SidebarBrand } from "@/components/layout/sidebar-brand";
import { cn } from "@/lib/utils";

export function TopBar({
  title,
  userEmail,
  navOpen,
  onNavToggle,
}: {
  title?: string;
  userEmail?: string | null;
  navOpen: boolean;
  onNavToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <SidebarBrand navOpen={navOpen} onToggle={onNavToggle} />
        {title && (
          <div className="hidden min-w-0 border-l border-gray-200 pl-4 dark:border-gray-700 lg:block">
            <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {userEmail && (
          <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">{userEmail}</span>
        )}
        <Link
          href="/settings"
          aria-label="设置"
          className={cn(
            "rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
            (pathname === "/settings" || pathname.startsWith("/settings/")) &&
              "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
          )}
        >
          <span aria-hidden className="text-base leading-none">
            ⚙
          </span>
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
