import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true, avatar: true },
  });

  return (
    <AppShell
      userProfile={{
        email: user?.email ?? session.email,
        name: user?.name ?? null,
        avatar: user?.avatar ?? null,
      }}
      userRole={session.role}
    >
      {children}
    </AppShell>
  );
}
