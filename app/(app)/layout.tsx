import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth/get-session";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <AppShell userEmail={session.email}>{children}</AppShell>;
}
