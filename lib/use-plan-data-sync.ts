"use client";

import { useEffect, useRef } from "react";
import {
  PLAN_UPDATED_EVENT,
  planDataVersion,
  type PlanUpdatedDetail,
} from "@/lib/plan-events";

export const APP_ROUTE_CHANGED_EVENT = "meridian:route-changed";

type PlanRefreshHandler = (detail?: PlanUpdatedDetail) => void | Promise<void>;

/**
 * Keeps a view in sync with plan mutations: live events, tab focus, and route changes
 * that happened while this view was unmounted.
 */
export function usePlanDataSync(
  refresh: PlanRefreshHandler,
  options?: {
    /** Refetch once when the hook mounts (e.g. kanban after SSR initial data). */
    refetchOnMount?: boolean;
  },
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const syncedVersionRef = useRef(-1);

  useEffect(() => {
    if (!options?.refetchOnMount) return;
    syncedVersionRef.current = planDataVersion;
    void refreshRef.current();
  }, [options?.refetchOnMount]);

  useEffect(() => {
    function markSynced(version = planDataVersion) {
      syncedVersionRef.current = version;
    }

    function onPlanUpdated(event: Event) {
      const detail = (event as CustomEvent<PlanUpdatedDetail>).detail;
      markSynced(detail?.version ?? planDataVersion);
      void refreshRef.current(detail);
    }

    function refetchIfStale() {
      if (planDataVersion <= syncedVersionRef.current) return;
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

    window.addEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
    window.addEventListener(APP_ROUTE_CHANGED_EVENT, onRouteChanged);
    document.addEventListener("visibilitychange", onVisibilityChange);
    refetchIfStale();

    return () => {
      window.removeEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
      window.removeEventListener(APP_ROUTE_CHANGED_EVENT, onRouteChanged);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
}
