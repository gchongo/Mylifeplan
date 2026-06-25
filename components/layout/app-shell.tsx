import { AppShellClient } from "@/components/layout/app-shell-client";

export function AppShell({
  children,
  title,
  userEmail,
  userRole,
}: {
  children: React.ReactNode;
  title?: string;
  userEmail?: string | null;
  userRole?: "user" | "admin";
}) {
  return (
    <AppShellClient title={title} userEmail={userEmail} userRole={userRole}>
      {children}
    </AppShellClient>
  );
}
