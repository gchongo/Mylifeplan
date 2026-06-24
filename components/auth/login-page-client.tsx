"use client";

import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginPageClient() {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("auth.loginTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-gray-500">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-brand-600 hover:underline">
            {t("auth.register")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
