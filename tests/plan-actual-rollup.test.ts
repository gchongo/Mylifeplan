import { describe, expect, it } from "vitest";
import { aggregateParentActualDates } from "@/lib/plan-actual-rollup";

const d = (iso: string) => new Date(iso);

describe("aggregateParentActualDates", () => {
  it("rolls up earliest start and latest end when all children are done", () => {
    expect(
      aggregateParentActualDates([
        {
          status: "done",
          actualStartDate: d("2026-06-05T09:00:00.000Z"),
          actualEndDate: d("2026-06-20T18:00:00.000Z"),
          startDate: d("2026-06-01T00:00:00.000Z"),
          endDate: d("2026-06-25T00:00:00.000Z"),
        },
        {
          status: "done",
          actualStartDate: d("2026-06-01T08:00:00.000Z"),
          actualEndDate: d("2026-06-25T10:00:00.000Z"),
          startDate: d("2026-06-01T00:00:00.000Z"),
          endDate: d("2026-06-30T00:00:00.000Z"),
        },
      ]),
    ).toEqual({
      actualStartDate: d("2026-06-01T08:00:00.000Z"),
      actualEndDate: d("2026-06-25T10:00:00.000Z"),
    });
  });

  it("falls back to planned dates for done children without actual timestamps", () => {
    expect(
      aggregateParentActualDates([
        {
          status: "done",
          actualStartDate: null,
          actualEndDate: null,
          startDate: d("2026-06-01T00:00:00.000Z"),
          endDate: d("2026-06-18T00:00:00.000Z"),
        },
        {
          status: "done",
          actualStartDate: null,
          actualEndDate: d("2026-06-22T12:00:00.000Z"),
          startDate: d("2026-06-10T00:00:00.000Z"),
          endDate: d("2026-06-30T00:00:00.000Z"),
        },
      ]),
    ).toEqual({
      actualStartDate: d("2026-06-01T00:00:00.000Z"),
      actualEndDate: d("2026-06-22T12:00:00.000Z"),
    });
  });

  it("clears actual end while children are still in progress", () => {
    expect(
      aggregateParentActualDates([
        {
          status: "done",
          actualStartDate: d("2026-06-01T08:00:00.000Z"),
          actualEndDate: d("2026-06-20T00:00:00.000Z"),
          startDate: null,
          endDate: null,
        },
        {
          status: "in_progress",
          actualStartDate: d("2026-06-05T09:00:00.000Z"),
          actualEndDate: null,
          startDate: null,
          endDate: null,
        },
      ]),
    ).toEqual({
      actualStartDate: d("2026-06-01T08:00:00.000Z"),
      actualEndDate: null,
    });
  });
});
