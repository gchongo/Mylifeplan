"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_USER_PREFERENCES,
  applyUserPreferences,
  normalizeUserPreferences,
  readUserPreferences,
  writeUserPreferences,
  type ContributionMarkerPreferences,
  type LanguagePreference,
  type ThemePreference,
  type UserPreferences,
} from "@/lib/user-preferences";

interface SettingsContextValue {
  preferences: UserPreferences;
  ready: boolean;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  setTimezone: (timezone: string) => void;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: LanguagePreference) => void;
  setContributionMarker: (patch: Partial<ContributionMarkerPreferences>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readUserPreferences();
    setPreferences(stored);
    applyUserPreferences(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || preferences.theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyUserPreferences(preferences);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [preferences, ready]);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const normalized = normalizeUserPreferences({ ...prev, ...patch });
      writeUserPreferences(normalized);
      applyUserPreferences(normalized);
      return normalized;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      preferences,
      ready,
      updatePreferences,
      setTimezone: (timezone) => updatePreferences({ timezone }),
      setTheme: (theme) => updatePreferences({ theme }),
      setLanguage: (language) => updatePreferences({ language }),
      setContributionMarker: (patch) =>
        updatePreferences({
          contributionMarker: { ...preferences.contributionMarker, ...patch },
        }),
    }),
    [preferences, ready, updatePreferences],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
