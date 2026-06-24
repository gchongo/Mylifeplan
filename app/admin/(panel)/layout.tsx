import { AdminPanelHeader } from "@/components/admin/admin-panel-header";
import { LocaleProviders } from "@/components/i18n/locale-providers";
import { getSession } from "@/lib/auth/get-session";
import { redirect } from "next/navigation";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session.role !== "admin") {
    redirect("/");
  }

  return (
    <LocaleProviders>
      <div className="min-h-screen bg-gray-100">
        <AdminPanelHeader email={session.email} />
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </div>
    </LocaleProviders>
  );
}
