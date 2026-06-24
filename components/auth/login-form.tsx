"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";

export function LoginForm({
  redirectTo = "/",
  requireAdmin = false,
}: {
  redirectTo?: string;
  requireAdmin?: boolean;
}) {
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError(t("auth.enterEmailPassword"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("auth.loginFailed"));
        return;
      }
      if (requireAdmin && data.user?.role !== "admin") {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        setError(t("auth.notAdmin"));
        return;
      }
      window.location.assign(redirectTo);
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
        defaultValue=""
        placeholder="you@example.com"
        required
        autoComplete="email"
      />
      <Input
        name="password"
        label={t("common.password")}
        type="password"
        defaultValue=""
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("auth.loggingIn") : t("auth.login")}
      </Button>
    </form>
  );
}
