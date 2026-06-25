const LEGACY_PREFIX = "mylifeplan";
export const APP_STORAGE_PREFIX = "meridian";

export function appStorageKey(suffix: string): string {
  return `${APP_STORAGE_PREFIX}-${suffix}`;
}

function legacyStorageKey(key: string): string | null {
  if (!key.startsWith(`${APP_STORAGE_PREFIX}-`)) return null;
  return key.replace(`${APP_STORAGE_PREFIX}-`, `${LEGACY_PREFIX}-`);
}

export function readStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(key);
  if (value != null) return value;
  const legacy = legacyStorageKey(key);
  return legacy ? localStorage.getItem(legacy) : null;
}

export function writeStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}
