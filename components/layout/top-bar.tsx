"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { SidebarBrand } from "@/components/layout/sidebar-brand";

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
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <SidebarBrand navOpen={navOpen} onToggle={onNavToggle} />
        {title && (
          <div className="hidden min-w-0 border-l border-gray-200 pl-4 lg:block">
            <h1 className="truncate text-lg font-semibold text-gray-900">{title}</h1>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {userEmail && (
          <span className="hidden text-sm text-gray-500 sm:inline">{userEmail}</span>
        )}
        <LogoutButton />
      </div>
    </header>
  );
}
