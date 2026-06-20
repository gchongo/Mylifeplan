import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">登录 MyLifePlan</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-gray-500">
          还没有账号？{" "}
          <Link href="/register" className="text-brand-600 hover:underline">
            注册
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
