"use client";

import { useEffect, useRef } from "react";
import { MEMO_UPDATED_EVENT, memoDataVersion } from "@/lib/memo-events";
import { APP_ROUTE_CHANGED_EVENT } from "@/lib/use-plan-data-sync";

type MemoRefreshHandler = () => void | Promise<void>;

export function useMemoDataSync(
  refresh: MemoRefreshHandler,
  options?: { refetchOnMount?: boolean },
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const syncedVersionRef = useRef(-1);

  useEffect(() => {
    if (!options?.refetchOnMount) return;
    syncedVersionRef.current = memoDataVersion;
    void refreshRef.current();
  }, [options?.refetchOnMount]);

  useEffect(() => {
    function markSynced(version = memoDataVersion) {
      syncedVersionRef.current = version;
    }

    function onMemoUpdated(event: Event) {
      const detail = (event as CustomEvent<{ version?: number }>).detail;
      markSynced(detail?.version ?? memoDataVersion);
      void refreshRef.current();
    }

    function refetchIfStale() {
      if (memoDataVersion <= syncedVersionRef.current) return;
      markSynced();
      void refreshRef.current();
    }

    function onRouteChanged() {
      refetchIfStale();
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      refetchIfStale();
    }

    window.addEventListener(MEMO_UPDATED_EVENT, onMemoUpdated);
    window.addEventListener(APP_ROUTE_CHANGED_EVENT, onRouteChanged);
    document.addEventListener("visibilitychange", onVisibilityChange);
    refetchIfStale();

    return () => {
      window.removeEventListener(MEMO_UPDATED_EVENT, onMemoUpdated);
      window.removeEventListener(APP_ROUTE_CHANGED_EVENT, onRouteChanged);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
}
