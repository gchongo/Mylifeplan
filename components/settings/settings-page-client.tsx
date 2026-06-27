"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { GanttActualLineSettings } from "@/components/settings/gantt-actual-line-settings";
import { GanttTodayColumnSettings } from "@/components/settings/gantt-today-column-settings";
import { CalendarWeekNumberSettings } from "@/components/settings/calendar-week-number-settings";
import { SettingsProfileSection } from "@/components/settings/settings-profile-section";
import { useI18n } from "@/components/i18n/i18n-provider";
import { TIMEZONE_OPTIONS, THEME_OPTIONS, LANGUAGE_OPTIONS, resolveTimezone } from "@/lib/user-preferences";
import { useSettings } from "@/components/settings/settings-provider";
import { SettingsSubscriptionSection } from "@/components/settings/settings-subscription-section";

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

export function SettingsPageClient({ userRole }: { userRole?: "user" | "admin" }) {
  const { t } = useI18n();
  const { preferences, ready, setTimezone, setTheme, setLanguage, setGanttActualLine, setGanttTodayColumn, setCalendarWeekNumbers } =
    useSettings();
  const effectiveTimezone = resolveTimezone(preferences.timezone);

  const timezoneOptions = TIMEZONE_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`settings.timezoneOption.${o.value}`),
  }));
  const themeOptions = THEME_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`settings.themeOption.${o.value}`),
  }));
  const languageOptions = LANGUAGE_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`settings.languageOption.${o.value}`),
  }));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("settings.intro")}</p>
      </div>

      <SettingsSubscriptionSection />

      <SettingsProfileSection />

      <SettingsSection title={t("settings.general")} description={t("settings.generalDesc")}>
        <Select
          label={t("settings.timezone")}
          value={preferences.timezone}
          disabled={!ready}
          options={timezoneOptions}
          onChange={(e) => setTimezone(e.target.value)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("settings.timezoneEffective")}
          <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{effectiveTimezone}</span>
        </p>

        <Select
          label={t("settings.language")}
          value={preferences.language}
          disabled={!ready}
          options={languageOptions}
          onChange={(e) => setLanguage(e.target.value as typeof preferences.language)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">{t("settings.languageNote")}</p>
      </SettingsSection>

      <SettingsSection title={t("settings.appearance")} description={t("settings.appearanceDesc")}>
        <Select
          label={t("settings.theme")}
          value={preferences.theme}
          disabled={!ready}
          options={themeOptions}
          onChange={(e) => setTheme(e.target.value as typeof preferences.theme)}
        />
      </SettingsSection>

      <SettingsSection title={t("settings.calendarWeek")} description={t("settings.calendarWeekDesc")}>
        <CalendarWeekNumberSettings
          value={preferences.calendarWeekNumbers}
          disabled={!ready}
          onChange={setCalendarWeekNumbers}
        />
      </SettingsSection>

      <SettingsSection title={t("settings.ganttToday")} description={t("settings.ganttTodayDesc")}>
        <GanttTodayColumnSettings
          value={preferences.ganttTodayColumn}
          disabled={!ready}
          onChange={setGanttTodayColumn}
        />
      </SettingsSection>

      <SettingsSection title={t("settings.ganttActual")} description={t("settings.ganttActualDesc")}>
        <GanttActualLineSettings
          value={preferences.ganttActualLine}
          disabled={!ready}
          onChange={setGanttActualLine}
        />
      </SettingsSection>

      <SettingsSection title={t("settings.account")}>
        <div className="flex flex-col gap-3">
          {userRole === "admin" && (
            <Link
              href="/admin"
              className="inline-flex w-fit items-center gap-2 text-sm text-brand-600 hover:underline dark:text-brand-400"
            >
              <span aria-hidden>◈</span>
              {t("nav.admin")}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/plans" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
              {t("common.backToPlans")}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
