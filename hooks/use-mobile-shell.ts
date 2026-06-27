"use client";

import { useSyncExternalStore } from "react";
import { MOBILE_SHELL_MEDIA } from "@/lib/mobile-shell";

function subscribeMobileShell(onStoreChange: () => void) {
  const mq = window.matchMedia(MOBILE_SHELL_MEDIA);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getMobileShellSnapshot() {
  return window.matchMedia(MOBILE_SHELL_MEDIA).matches;
}

function getMobileShellServerSnapshot() {
  return false;
}

export function useMobileShell(): boolean {
  return useSyncExternalStore(
    subscribeMobileShell,
    getMobileShellSnapshot,
    getMobileShellServerSnapshot,
  );
}
