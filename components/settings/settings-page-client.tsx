"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  TIMEZONE_OPTIONS,
  resolveTimezone,
} from "@/lib/user-preferences";
import { useSettings } from "@/components/settings/settings-provider";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="mt-1 text-sm font-normal text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function SettingsPageClient({ userEmail }: { userEmail?: string | null }) {
  const { preferences, ready, setTimezone, setTheme, setLanguage } = useSettings();
  const effectiveTimezone = resolveTimezone(preferences.timezone);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">设置</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          管理时区、主题、语言等个人偏好。部分选项将在后续版本中逐步生效。
        </p>
      </div>

      <SettingsSection title="通用" description="影响日期显示与界面语言。">
        <Select
          label="时区"
          value={preferences.timezone}
          disabled={!ready}
          options={[...TIMEZONE_OPTIONS]}
          onChange={(e) => setTimezone(e.target.value)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          当前生效时区：
          <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{effectiveTimezone}</span>
        </p>

        <Select
          label="语言"
          value={preferences.language}
          disabled={!ready}
          options={[...LANGUAGE_OPTIONS]}
          onChange={(e) => setLanguage(e.target.value as typeof preferences.language)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          完整多语言界面正在开发中，当前仍以简体中文为主。
        </p>
      </SettingsSection>

      <SettingsSection title="外观" description="选择浅色、深色或跟随系统。">
        <Select
          label="主题"
          value={preferences.theme}
          disabled={!ready}
          options={[...THEME_OPTIONS]}
          onChange={(e) => setTheme(e.target.value as typeof preferences.theme)}
        />
      </SettingsSection>

      <SettingsSection title="账户">
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500 dark:text-gray-400">登录邮箱</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{userEmail ?? "—"}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <LogoutButton />
          <Link href="/" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
            返回首页
          </Link>
        </div>
      </SettingsSection>
    </div>
  );
}
