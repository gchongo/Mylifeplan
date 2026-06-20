"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
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
        setError(data.error ?? "注册失败");
        return;
      }
      router.push("/");
      router.refresh();
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
        placeholder="you@example.com"
        required
        autoComplete="email"
      />
      <Input
        name="name"
        label="昵称（可选）"
        placeholder="你的名字"
        autoComplete="name"
      />
      <Input
        name="password"
        label="密码"
        type="password"
        placeholder="至少 8 位"
        required
        minLength={8}
        autoComplete="new-password"
      />
      <Input
        name="confirmPassword"
        label="确认密码"
        type="password"
        placeholder="再次输入密码"
        required
        autoComplete="new-password"
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "注册中…" : "注册"}
      </Button>
    </form>
  );
}
