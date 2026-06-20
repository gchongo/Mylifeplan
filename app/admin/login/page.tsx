import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>管理员登录</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo="/admin/users" requireAdmin />
          <p className="mt-4 text-center text-sm">
            <Link href="/login" className="text-brand-600 hover:underline">
              普通用户登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
