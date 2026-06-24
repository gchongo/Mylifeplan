"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSettings } from "@/components/settings/settings-provider";
import { createTranslator, type TranslationKey } from "@/lib/i18n/translate";
import type { LanguagePreference } from "@/lib/user-preferences";

type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: LanguagePreference;
  t: TranslateFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { preferences } = useSettings();
  const locale = preferences.language;

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: createTranslator(locale),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
