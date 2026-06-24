"use client";

import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminLoginPageClient() {
  const { t } = useI18n();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("auth.adminLoginTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm redirectTo="/admin/users" requireAdmin />
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-brand-600 hover:underline">
            {t("auth.userLoginLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
