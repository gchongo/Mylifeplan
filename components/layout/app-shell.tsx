import { AppShellClient } from "@/components/layout/app-shell-client";
import type { UserProfile } from "@/components/user/user-profile-provider";

export function AppShell({
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
    <AppShellClient title={title} userProfile={userProfile} userRole={userRole}>
      {children}
    </AppShellClient>
  );
}
