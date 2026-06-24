"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { SettingsProvider } from "@/components/settings/settings-provider";

export function LocaleProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <I18nProvider>{children}</I18nProvider>
    </SettingsProvider>
  );
}
