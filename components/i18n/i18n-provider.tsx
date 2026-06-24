"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSettings } from "@/components/settings/settings-provider";
import { createTranslator, loadMessages, type MessageTree, type TranslationKey } from "@/lib/i18n/translate";
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
  const [messages, setMessages] = useState<MessageTree | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMessages(locale).then((tree) => {
      if (!cancelled) setMessages(tree);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const t = messages ? createTranslator(locale, messages) : createTranslator("zh-CN");
    return { locale, t };
  }, [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
