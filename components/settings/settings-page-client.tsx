"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  CONTRIBUTION_MARKER_SHAPE_OPTIONS,
  CONTRIBUTION_MARKER_SIZE_OPTIONS,
  DEFAULT_CONTRIBUTION_MARKER,
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  TIMEZONE_OPTIONS,
  resolveTimezone,
} from "@/lib/user-preferences";
import { useSettings } from "@/components/settings/settings-provider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
  const { preferences, ready, setTimezone, setTheme, setLanguage, setContributionMarker } =
    useSettings();
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

      <SettingsSection
        title="甘特图贡献点"
        description="自定义甘特图时间轴上贡献记录圆点的样式。"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[8rem]">
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">预览</p>
            <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
              <span
                className={
                  preferences.contributionMarker.shape === "square"
                    ? "rounded-sm"
                    : preferences.contributionMarker.shape === "diamond"
                      ? "rotate-45 rounded-[1px]"
                      : "rounded-full"
                }
                style={{
                  width:
                    preferences.contributionMarker.size === "md"
                      ? 12
                      : preferences.contributionMarker.size === "sm"
                        ? 10
                        : 8,
                  height:
                    preferences.contributionMarker.size === "md"
                      ? 12
                      : preferences.contributionMarker.size === "sm"
                        ? 10
                        : 8,
                  backgroundColor: preferences.contributionMarker.color,
                }}
              />
            </div>
          </div>
          <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={!ready}
                value={preferences.contributionMarker.color}
                onChange={(e) => setContributionMarker({ color: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-900"
              />
              <Input
                value={preferences.contributionMarker.color}
                disabled={!ready}
                onChange={(e) => setContributionMarker({ color: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>
        <Select
          label="大小"
          value={preferences.contributionMarker.size}
          disabled={!ready}
          options={[...CONTRIBUTION_MARKER_SIZE_OPTIONS]}
          onChange={(e) =>
            setContributionMarker({
              size: e.target.value as typeof preferences.contributionMarker.size,
            })
          }
        />
        <Select
          label="形状"
          value={preferences.contributionMarker.shape}
          disabled={!ready}
          options={[...CONTRIBUTION_MARKER_SHAPE_OPTIONS]}
          onChange={(e) =>
            setContributionMarker({
              shape: e.target.value as typeof preferences.contributionMarker.shape,
            })
          }
        />
        <button
          type="button"
          disabled={!ready}
          className="text-sm text-brand-600 hover:underline dark:text-brand-400"
          onClick={() => setContributionMarker(DEFAULT_CONTRIBUTION_MARKER)}
        >
          恢复默认
        </button>
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
