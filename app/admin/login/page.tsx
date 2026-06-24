import { AdminLoginPageClient } from "@/components/auth/admin-login-page-client";
import { LocaleProviders } from "@/components/i18n/locale-providers";

export default function AdminLoginPage() {
  return (
    <LocaleProviders>
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <AdminLoginPageClient />
      </div>
    </LocaleProviders>
  );
}
