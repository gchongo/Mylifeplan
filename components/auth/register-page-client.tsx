"use client";

import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterPageClient() {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("auth.registerTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-gray-500">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="text-brand-600 hover:underline">
            {t("auth.login")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
