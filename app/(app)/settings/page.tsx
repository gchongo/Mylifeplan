import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true },
      })
    : null;

  return <SettingsPageClient userEmail={user?.email} />;
}
