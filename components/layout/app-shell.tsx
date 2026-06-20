import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({
  children,
  title,
  userEmail,
}: {
  children: React.ReactNode;
  title?: string;
  userEmail?: string | null;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white lg:block">
        <SidebarNav />
      </aside>
      <div className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
        <TopBar title={title} userEmail={userEmail} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  );
}
