"use client";

import { useCallback, useEffect, useState } from "react";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";
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
  const [isDesktop, setIsDesktop] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const sync = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      setOpen(readStoredOpen(desktop));
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "false");
  }, []);

  const sidebarWidth = open ? "w-56" : isDesktop ? "w-14" : "w-0";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!isDesktop && open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          aria-label="关闭导航"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "shrink-0 overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-300 ease-in-out",
          sidebarWidth,
          !isDesktop && open && "fixed inset-y-0 left-0 z-50 shadow-xl",
          !isDesktop && !open && "pointer-events-none border-r-0",
        )}
      >
        <SidebarNav open={open} onToggle={toggle} onNavigate={!isDesktop ? close : undefined} />
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <TopBar
          title={title}
          userEmail={userEmail}
          onMenuToggle={!isDesktop && !open ? toggle : undefined}
        />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 lg:p-6">{children}</main>
      </div>

      <MobileTabBar />
    </div>
  );
}
