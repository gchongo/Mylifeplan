import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";

export function TopBar({
  title,
  userEmail,
}: {
  title?: string;
  userEmail?: string | null;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="lg:hidden">
        <p className="text-base font-semibold text-gray-900">{title ?? "MyLifePlan"}</p>
      </div>
      <div className="hidden lg:block">
        {title && <h1 className="text-lg font-semibold text-gray-900">{title}</h1>}
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
