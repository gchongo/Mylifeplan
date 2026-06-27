import { getSession } from "@/lib/auth/get-session";
import { SettingsPageClient } from "@/components/settings/settings-page-client";

export default async function SettingsPage() {
  const session = await getSession();
  return <SettingsPageClient userRole={session?.role} />;
}
