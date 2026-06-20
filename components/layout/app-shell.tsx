import { AppShellClient } from "@/components/layout/app-shell-client";

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
    <AppShellClient title={title} userEmail={userEmail}>
      {children}
    </AppShellClient>
  );
}
