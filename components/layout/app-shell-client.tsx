"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SettingsProvider } from "@/components/settings/settings-provider";
import { I18nProvider, useI18n } from "@/components/i18n/i18n-provider";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SidebarNavDrawer } from "@/components/layout/sidebar-brand";
import { SidebarNavMenu } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";
import { UserProfileProvider, type UserProfile } from "@/components/user/user-profile-provider";
import { QueryProvider } from "@/lib/query/provider";
import { isAppShellFullBleed } from "@/lib/app-shell-layout";
import { readStorageItem, writeStorageItem } from "@/lib/app-storage";
import { MOBILE_SHELL_MEDIA } from "@/lib/mobile-shell";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "meridian-sidebar-open";
const DESKTOP_SIDEBAR_MEDIA = "(min-width: 1024px) and (min-aspect-ratio: 1/1)";

function readStoredOpen(fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const raw = readStorageItem(STORAGE_KEY);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
}

export function AppShellClient({
  children,
  title,
  userProfile,
  userRole,
}: {
  children: React.ReactNode;
  title?: string;
  userProfile: UserProfile;
  userRole?: "user" | "admin";
}) {
  return (
    <QueryProvider>
      <SettingsProvider>
        <I18nProvider>
          <UserProfileProvider initialProfile={userProfile}>
            <AppShellInner title={title} userRole={userRole}>
              {children}
            </AppShellInner>
          </UserProfileProvider>
        </I18nProvider>
      </SettingsProvider>
    </QueryProvider>
  );
}

function AppShellInner({
  children,
  title,
  userRole,
}: {
  children: React.ReactNode;
  title?: string;
  userRole?: "user" | "admin";
}) {
  const { t } = useI18n();
  const [isDesktopSidebar, setIsDesktopSidebar] = useState(true);
  const [isMobileShell, setIsMobileShell] = useState(false);
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    const desktopMq = window.matchMedia(DESKTOP_SIDEBAR_MEDIA);
    const mobileMq = window.matchMedia(MOBILE_SHELL_MEDIA);
    const sync = () => {
      const desktop = desktopMq.matches;
      setIsDesktopSidebar(desktop);
      setIsMobileShell(mobileMq.matches);
      setNavOpen(readStoredOpen(desktop));
    };
    sync();
    desktopMq.addEventListener("change", sync);
    mobileMq.addEventListener("change", sync);
    return () => {
      desktopMq.removeEventListener("change", sync);
      mobileMq.removeEventListener("change", sync);
    };
  }, []);

  const toggleNav = useCallback(() => {
    setNavOpen((prev) => {
      const next = !prev;
      writeStorageItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const closeNav = useCallback(() => {
    setNavOpen(false);
    writeStorageItem(STORAGE_KEY, "false");
  }, []);

  const pathname = usePathname();
  const fullBleed = isAppShellFullBleed(pathname);
  const hideMobileNav = isMobileShell && pathname.startsWith("/settings");
  const mobileNavOpen = navOpen && !hideMobileNav;

  useEffect(() => {
    if (!fullBleed) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [fullBleed]);

  return (
    <div
      className={cn(
        "flex flex-col bg-gray-50 dark:bg-gray-950",
        fullBleed ? "h-screen max-h-[100dvh] overflow-hidden" : "min-h-screen",
      )}
    >
      <TopBar title={title} navOpen={navOpen} onNavToggle={toggleNav} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {!isDesktopSidebar && mobileNavOpen && (
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-black/30 lg:hidden"
            aria-label={t("layout.closeNav")}
            onClick={closeNav}
          />
        )}

        {isDesktopSidebar ? (
          <SidebarNavDrawer open={navOpen} className="hidden lg:block">
            <SidebarNavMenu userRole={userRole} />
          </SidebarNavDrawer>
        ) : (
          navOpen && (
            <aside
              className={cn(
                "sidebar-nav-drawer fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-56",
                "border-r border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 lg:hidden",
                hideMobileNav && "hidden",
              )}
            >
              <SidebarNavMenu onNavigate={closeNav} userRole={userRole} />
            </aside>
          )
        )}

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
            isMobileShell && "pb-[calc(3.5rem+env(safe-area-inset-bottom))]",
          )}
        >
          <main
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden",
              fullBleed ? "overflow-hidden" : "overflow-y-auto",
              !fullBleed && !isMobileShell && "p-4 lg:p-6",
              !fullBleed && isMobileShell && "p-0",
            )}
          >
            {children}
          </main>
        </div>
      </div>

      <MobileTabBar />
    </div>
  );
}
