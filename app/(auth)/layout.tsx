import { LocaleProviders } from "@/components/i18n/locale-providers";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProviders>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100 p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </LocaleProviders>
  );
}
