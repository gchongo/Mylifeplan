export const PLAN_UPDATED_EVENT = "meridian:plan-updated";

export function dispatchPlanUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PLAN_UPDATED_EVENT));
  }
}
