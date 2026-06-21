import { describe, expect, it } from "vitest";
import {
  shouldShowInCalendar,
  shouldShowInGantt,
  shouldShowInMemo,
} from "@/lib/content-router";

describe("routing decision table", () => {
  it("no dates root plan → memo only", () => {
    const item = {};
    expect(shouldShowInMemo(item)).toBe(true);
    expect(shouldShowInCalendar(item)).toBe(false);
    expect(shouldShowInGantt(item)).toBe(false);
  });

  it("no dates sub-plan → not memo", () => {
    const item = { parentPlanId: "parent-1" };
    expect(shouldShowInMemo(item)).toBe(false);
  });

  it("start only → calendar + gantt, not memo", () => {
    const item = { startDate: "2025-01-01" };
    expect(shouldShowInMemo(item)).toBe(false);
    expect(shouldShowInCalendar(item)).toBe(true);
    expect(shouldShowInGantt(item)).toBe(true);
  });

  it("start + due → calendar + gantt, not memo", () => {
    const item = { startDate: "2025-01-01", dueDate: "2025-03-01" };
    expect(shouldShowInMemo(item)).toBe(false);
    expect(shouldShowInCalendar(item)).toBe(true);
    expect(shouldShowInGantt(item)).toBe(true);
  });
});
