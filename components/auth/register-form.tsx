"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";

export function RegisterForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          name: name || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("auth.registerFailed"));
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError(t("auth.networkRetry"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <Input
        name="email"
        label={t("common.email")}
        type="email"
        placeholder="you@example.com"
        required
        autoComplete="email"
      />
      <Input
        name="name"
        label={t("common.nameOptional")}
        placeholder={t("auth.namePlaceholder")}
        autoComplete="name"
      />
      <Input
        name="password"
        label={t("common.password")}
        type="password"
        placeholder={t("auth.passwordPlaceholder")}
        required
        minLength={8}
        autoComplete="new-password"
      />
      <Input
        name="confirmPassword"
        label={t("common.confirmPassword")}
        type="password"
        placeholder={t("auth.confirmPasswordPlaceholder")}
        required
        autoComplete="new-password"
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("auth.registering") : t("auth.register")}
      </Button>
    </form>
  );
}
