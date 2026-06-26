import { describe, expect, it } from "vitest";
import {
  applyActualDateChangeToStatus,
  applyStatusChangeToActualDates,
  reconcilePlanStatusAndActualDates,
  resolveInitialPlanStatusAndActualDates,
} from "@/lib/plan-status-actual-dates";

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

  it("clears actual dates when reverting in progress to not started", () => {
    expect(
      applyStatusChangeToActualDates({
        previousStatus: "in_progress",
        nextStatus: "not_started",
        actualStart: start,
        actualEnd: null,
        explicitActualStart: false,
        explicitActualEnd: false,
        now,
      }),
    ).toEqual({ actualStart: null, actualEnd: null });
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

describe("applyActualDateChangeToStatus", () => {
  it("moves not_started to in_progress when actual start is set", () => {
    expect(
      applyActualDateChangeToStatus({
        previousStatus: "not_started",
        actualStart: start,
        actualEnd: null,
        previousActualStart: null,
        previousActualEnd: null,
        actualStartExplicit: true,
        actualEndExplicit: false,
      }),
    ).toEqual({ status: "in_progress", actualStart: start, actualEnd: null });
  });

  it("moves to done when actual end is set", () => {
    expect(
      applyActualDateChangeToStatus({
        previousStatus: "in_progress",
        actualStart: start,
        actualEnd: end,
        previousActualStart: start,
        previousActualEnd: null,
        actualStartExplicit: false,
        actualEndExplicit: true,
      }),
    ).toEqual({ status: "done", actualStart: start, actualEnd: end });
  });

  it("fills actual start when only actual end is provided", () => {
    expect(
      applyActualDateChangeToStatus({
        previousStatus: "not_started",
        actualStart: null,
        actualEnd: end,
        previousActualStart: null,
        previousActualEnd: null,
        actualStartExplicit: false,
        actualEndExplicit: true,
      }),
    ).toEqual({ status: "done", actualStart: end, actualEnd: end });
  });

  it("reopens to in_progress when actual end is cleared on a done plan", () => {
    expect(
      applyActualDateChangeToStatus({
        previousStatus: "done",
        actualStart: start,
        actualEnd: null,
        previousActualStart: start,
        previousActualEnd: end,
        actualStartExplicit: false,
        actualEndExplicit: true,
      }),
    ).toEqual({ status: "in_progress", actualStart: start, actualEnd: null });
  });

  it("reverts to not_started when actual start is cleared", () => {
    expect(
      applyActualDateChangeToStatus({
        previousStatus: "in_progress",
        actualStart: null,
        actualEnd: null,
        previousActualStart: start,
        previousActualEnd: null,
        actualStartExplicit: true,
        actualEndExplicit: false,
      }),
    ).toEqual({ status: "not_started", actualStart: null, actualEnd: null });
  });

  it("keeps done when editing actual start on a completed plan", () => {
    expect(
      applyActualDateChangeToStatus({
        previousStatus: "done",
        actualStart: new Date("2026-06-02T09:00:00.000Z"),
        actualEnd: end,
        previousActualStart: start,
        previousActualEnd: end,
        actualStartExplicit: true,
        actualEndExplicit: false,
      }),
    ).toEqual({
      status: "done",
      actualStart: new Date("2026-06-02T09:00:00.000Z"),
      actualEnd: end,
    });
  });

  it("does not change archived status", () => {
    expect(
      applyActualDateChangeToStatus({
        previousStatus: "archived",
        actualStart: start,
        actualEnd: null,
        previousActualStart: null,
        previousActualEnd: null,
        actualStartExplicit: true,
        actualEndExplicit: false,
      }),
    ).toEqual({ status: "archived", actualStart: start, actualEnd: null });
  });
});

describe("reconcilePlanStatusAndActualDates", () => {
  it("prefers explicit status change over actual date inference", () => {
    expect(
      reconcilePlanStatusAndActualDates({
        previousStatus: "in_progress",
        requestedStatus: "not_started",
        actualStart: start,
        actualEnd: null,
        previousActualStart: start,
        previousActualEnd: null,
        statusExplicit: true,
        actualStartExplicit: true,
        actualEndExplicit: false,
      }),
    ).toEqual({ status: "not_started", actualStart: null, actualEnd: null });
  });

  it("derives in_progress when only actual start changes", () => {
    expect(
      reconcilePlanStatusAndActualDates({
        previousStatus: "not_started",
        requestedStatus: "not_started",
        actualStart: start,
        actualEnd: null,
        previousActualStart: null,
        previousActualEnd: null,
        statusExplicit: true,
        actualStartExplicit: true,
        actualEndExplicit: false,
      }),
    ).toEqual({ status: "in_progress", actualStart: start, actualEnd: null });
  });
});

describe("resolveInitialPlanStatusAndActualDates", () => {
  it("sets actual start when creating as in_progress", () => {
    const resolved = resolveInitialPlanStatusAndActualDates({
      requestedStatus: "in_progress",
      actualStart: null,
      actualEnd: null,
      actualStartExplicit: false,
      actualEndExplicit: false,
      now,
    });
    expect(resolved).toEqual({ status: "in_progress", actualStart: now, actualEnd: null });
  });

  it("aligns status when creating with actual start", () => {
    expect(
      resolveInitialPlanStatusAndActualDates({
        requestedStatus: "not_started",
        actualStart: start,
        actualEnd: null,
        actualStartExplicit: true,
        actualEndExplicit: false,
        now,
      }),
    ).toEqual({ status: "in_progress", actualStart: start, actualEnd: null });
  });
});
