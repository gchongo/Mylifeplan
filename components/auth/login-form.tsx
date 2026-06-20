"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";

export function LoginForm({
  redirectTo = "/",
  requireAdmin = false,
}: {
  redirectTo?: string;
  requireAdmin?: boolean;
}) {
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
      setError("请输入邮箱和密码");
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
        setError(data.error ?? "登录失败");
        return;
      }
      if (requireAdmin && data.user?.role !== "admin") {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        setError("该账号不是管理员");
        return;
      }
      // Full navigation ensures Set-Cookie is applied before protected requests.
      window.location.assign(redirectTo);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <Input
        name="email"
        label="邮箱"
        type="email"
        defaultValue=""
        placeholder="you@example.com"
        required
        autoComplete="email"
      />
      <Input
        name="password"
        label="密码"
        type="password"
        defaultValue=""
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "登录中…" : "登录"}
      </Button>
    </form>
  );
}
