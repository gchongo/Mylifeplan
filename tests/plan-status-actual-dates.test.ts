import { describe, expect, it } from "vitest";
import { applyStatusChangeToActualDates } from "@/lib/plan-status-actual-dates";

const now = new Date("2026-06-20T15:30:00.000Z");
const start = new Date("2026-06-01T09:00:00.000Z");
const end = new Date("2026-06-18T18:00:00.000Z");

describe("applyStatusChangeToActualDates", () => {
  it("clears actual end when reopening a completed plan", () => {
    expect(
      applyStatusChangeToActualDates({
        previousStatus: "done",
        nextStatus: "in_progress",
        actualStart: start,
        actualEnd: end,
        explicitActualStart: false,
        explicitActualEnd: false,
        now,
      }),
    ).toEqual({ actualStart: start, actualEnd: null });
  });

  it("sets actual end to now when completing an in-progress plan", () => {
    expect(
      applyStatusChangeToActualDates({
        previousStatus: "in_progress",
        nextStatus: "done",
        actualStart: start,
        actualEnd: null,
        explicitActualStart: false,
        explicitActualEnd: false,
        now,
      }),
    ).toEqual({ actualStart: start, actualEnd: now });
  });

  it("overwrites actual end when completing from in progress even if one exists", () => {
    expect(
      applyStatusChangeToActualDates({
        previousStatus: "in_progress",
        nextStatus: "done",
        actualStart: start,
        actualEnd: end,
        explicitActualStart: false,
        explicitActualEnd: false,
        now,
      }),
    ).toEqual({ actualStart: start, actualEnd: now });
  });

  it("sets actual start when moving to in progress without one", () => {
    expect(
      applyStatusChangeToActualDates({
        previousStatus: "not_started",
        nextStatus: "in_progress",
        actualStart: null,
        actualEnd: null,
        explicitActualStart: false,
        explicitActualEnd: false,
        now,
      }),
    ).toEqual({ actualStart: now, actualEnd: null });
  });

  it("sets actual end when marking not_started as done", () => {
    expect(
      applyStatusChangeToActualDates({
        previousStatus: "not_started",
        nextStatus: "done",
        actualStart: null,
        actualEnd: null,
        explicitActualStart: false,
        explicitActualEnd: false,
        now,
      }),
    ).toEqual({ actualStart: now, actualEnd: now });
  });

  it("does not change actual dates when caller supplies them explicitly", () => {
    const customEnd = new Date("2026-06-25T10:00:00.000Z");
    expect(
      applyStatusChangeToActualDates({
        previousStatus: "in_progress",
        nextStatus: "done",
        actualStart: start,
        actualEnd: customEnd,
        explicitActualStart: false,
        explicitActualEnd: true,
        now,
      }),
    ).toEqual({ actualStart: start, actualEnd: customEnd });
  });

  it("clears actual dates when reverting to not started", () => {
    expect(
      applyStatusChangeToActualDates({
        previousStatus: "done",
        nextStatus: "not_started",
        actualStart: start,
        actualEnd: end,
        explicitActualStart: false,
        explicitActualEnd: false,
        now,
      }),
    ).toEqual({ actualStart: null, actualEnd: null });
  });

  it("sets actual start to now when completing directly from not started", () => {
    const planStart = new Date("2026-06-01T09:00:00.000Z");
    expect(
      applyStatusChangeToActualDates({
        previousStatus: "not_started",
        nextStatus: "done",
        actualStart: null,
        actualEnd: null,
        explicitActualStart: false,
        explicitActualEnd: false,
        planStart,
        now,
      }),
    ).toEqual({ actualStart: now, actualEnd: now });
  });
});
