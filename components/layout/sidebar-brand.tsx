"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

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

export function SidebarBrand({
  navOpen,
  onToggle,
}: {
  navOpen: boolean;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="sidebar-brand flex min-w-0 items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        aria-label={navOpen ? t("layout.collapseNav") : t("layout.expandNav")}
        aria-expanded={navOpen}
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-brand-700 dark:text-brand-300 lg:text-lg">{t("layout.brandName")}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{t("layout.brandTagline")}</p>
      </div>
    </div>
  );
}

export function SidebarNavDrawer({
  open,
  children,
  className,
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "sidebar-nav-drawer shrink-0 overflow-hidden bg-white transition-[width] duration-300 ease-in-out dark:bg-gray-900",
        open ? "w-56 border-r border-gray-200 dark:border-gray-800" : "w-0 border-r-0",
        className,
      )}
      aria-hidden={!open}
    >
      <div className={cn("h-full w-56", !open && "pointer-events-none opacity-0")}>{children}</div>
    </aside>
  );
}
