"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";

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

export function TopBar({
  title,
  userEmail,
  onMenuToggle,
}: {
  title?: string;
  userEmail?: string | null;
  onMenuToggle?: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 lg:hidden"
            aria-label="展开导航"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 lg:hidden">
          <p className="truncate text-base font-semibold text-gray-900">{title ?? "MyLifePlan"}</p>
        </div>
        <div className="hidden min-w-0 lg:block">
          {title && <h1 className="truncate text-lg font-semibold text-gray-900">{title}</h1>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {userEmail && (
          <span className="hidden text-sm text-gray-500 sm:inline">{userEmail}</span>
        )}
        <Link href="/tasks/new">
          <Button size="sm">新建任务</Button>
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
