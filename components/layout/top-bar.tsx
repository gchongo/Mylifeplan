"use client";

import Link from "next/link";
import { SidebarBrand } from "@/components/layout/sidebar-brand";
import { useI18n } from "@/components/i18n/i18n-provider";
import { UserAvatar } from "@/components/user/user-avatar";
import { profileDisplayName, useUserProfile } from "@/components/user/user-profile-provider";

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
      </div>
    </header>
  );
}
