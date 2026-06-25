"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { SidebarBrand } from "@/components/layout/sidebar-brand";
import { useI18n } from "@/components/i18n/i18n-provider";
import { UserAvatar } from "@/components/user/user-avatar";
import { profileDisplayName, useUserProfile } from "@/components/user/user-profile-provider";
import { dispatchAppRefresh } from "@/lib/app-refresh-events";
import { cn } from "@/lib/utils";

export function TopBar({
  title,
  navOpen,
  onNavToggle,
}: {
  title?: string;
  navOpen: boolean;
  onNavToggle: () => void;
}) {
  const { t } = useI18n();
  const { profile } = useUserProfile();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      dispatchAppRefresh();
      await new Promise((resolve) => window.setTimeout(resolve, 400));
    } finally {
      setRefreshing(false);
    }
  }

  const displayName = profileDisplayName(profile);

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
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          aria-label={t("layout.refresh")}
          title={t("layout.refresh")}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <svg
            className={cn("h-[18px] w-[18px]", refreshing && "animate-spin")}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h5M20 20v-5h-5M20 4A8 8 0 004 12M4 20a8 8 0 0016-8"
            />
          </svg>
        </button>
        <Link
          href="/settings"
          aria-label={t("layout.openProfileSettings")}
          title={displayName}
          className="rounded-full p-0.5 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <UserAvatar
            name={profile.name}
            email={profile.email}
            avatar={profile.avatar}
            size="sm"
          />
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
