import type { SerializedPlanForGantt } from "@/lib/gantt-plan-sync";

export const PLAN_UPDATED_EVENT = "meridian:plan-updated";

export type PlanUpdatedDetail = {
  plan?: SerializedPlanForGantt;
  version?: number;
};

/** Monotonic counter so views can refetch after navigation when they missed the event. */
export let planDataVersion = 0;

export function dispatchPlanUpdated(detail?: PlanUpdatedDetail) {
  planDataVersion += 1;
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<PlanUpdatedDetail>(PLAN_UPDATED_EVENT, {
        detail: { ...detail, version: planDataVersion },
      }),
    );
  }
}
