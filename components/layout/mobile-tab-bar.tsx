"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useMobileShell } from "@/hooks/use-mobile-shell";
import { shouldShowMobileTabBar, type MobileTabPath } from "@/lib/mobile-shell";
import { cn } from "@/lib/utils";

const iconClass = "h-5 w-5 shrink-0";

function TabIconFeed({ className }: { className?: string }) {
  return (
    <svg className={cn(iconClass, className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TabIconGantt({ className }: { className?: string }) {
  return (
    <svg className={cn(iconClass, className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="10" width="14" height="4" rx="1" fill="currentColor" />
      <rect x="8" y="16" width="10" height="4" rx="1" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function TabIconCalendar({ className }: { className?: string }) {
  return (
    <svg className={cn(iconClass, className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M8 13h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

function TabIconKanban({ className }: { className?: string }) {
  return (
    <svg className={cn(iconClass, className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
    </svg>
  );
}

function TabIconMemos({ className }: { className?: string }) {
  return (
    <svg className={cn(iconClass, className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M9 9h6M9 12h6M9 15h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

const tabs: {
  href: MobileTabPath;
  labelKey: "mobile.feed" | "mobile.gantt" | "mobile.calendar" | "mobile.kanban" | "mobile.memos";
  Icon: typeof TabIconFeed;
}[] = [
  { href: "/feed", labelKey: "mobile.feed", Icon: TabIconFeed },
  { href: "/gantt", labelKey: "mobile.gantt", Icon: TabIconGantt },
  { href: "/calendar", labelKey: "mobile.calendar", Icon: TabIconCalendar },
  { href: "/plans", labelKey: "mobile.kanban", Icon: TabIconKanban },
  { href: "/memos", labelKey: "mobile.memos", Icon: TabIconMemos },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const isMobileShell = useMobileShell();

  if (!shouldShowMobileTabBar(pathname, isMobileShell)) return null;

  return (
    <nav
      className="mobile-tab-bar fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-800 dark:bg-gray-950"
      aria-label={t("mobile.tabBarAria")}
    >
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          const { Icon } = tab;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                active
                  ? "font-medium text-brand-600 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              <Icon />
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
