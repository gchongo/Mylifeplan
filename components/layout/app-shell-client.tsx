"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SettingsProvider } from "@/components/settings/settings-provider";
import { I18nProvider, useI18n } from "@/components/i18n/i18n-provider";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SidebarNavDrawer } from "@/components/layout/sidebar-brand";
import { SidebarNavMenu } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";
import { isAppShellFullBleed } from "@/lib/app-shell-layout";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "mylifeplan-sidebar-open";
const DESKTOP_QUERY = "(min-width: 1024px)";

function readStoredOpen(fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
}

export function AppShellClient({
  children,
  title,
  userEmail,
}: {
  children: React.ReactNode;
  title?: string;
  userEmail?: string | null;
}) {
  return (
    <SettingsProvider>
      <I18nProvider>
        <AppShellInner title={title} userEmail={userEmail}>
          {children}
        </AppShellInner>
      </I18nProvider>
    </SettingsProvider>
  );
}

function AppShellInner({
  children,
  title,
  userEmail,
}: {
  children: React.ReactNode;
  title?: string;
  userEmail?: string | null;
}) {
  const { t } = useI18n();
  const [isDesktop, setIsDesktop] = useState(true);
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const sync = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      setNavOpen(readStoredOpen(desktop));
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const toggleNav = useCallback(() => {
    setNavOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const closeNav = useCallback(() => {
    setNavOpen(false);
    localStorage.setItem(STORAGE_KEY, "false");
  }, []);

  const pathname = usePathname();
  const fullBleed = isAppShellFullBleed(pathname);

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
      <TopBar title={title} userEmail={userEmail} navOpen={navOpen} onNavToggle={toggleNav} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {!isDesktop && navOpen && (
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-black/30 lg:hidden"
            aria-label={t("layout.closeNav")}
            onClick={closeNav}
          />
        )}

        {isDesktop ? (
          <SidebarNavDrawer open={navOpen} className="hidden lg:block">
            <SidebarNavMenu />
          </SidebarNavDrawer>
        ) : (
          navOpen && (
            <aside
              className={cn(
                "sidebar-nav-drawer fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-56",
                "border-r border-gray-200 bg-white shadow-xl lg:hidden",
              )}
            >
              <SidebarNavMenu onNavigate={closeNav} />
            </aside>
          )
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
          <main
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden",
              fullBleed ? "overflow-hidden" : "overflow-y-auto",
              !fullBleed && "p-4 lg:p-6",
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
