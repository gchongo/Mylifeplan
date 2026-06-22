import { describe, expect, it } from "vitest";
import {
  getEffectiveActualEnd,
  getParentActualExecutionFill,
  getPlanActualExecutionSpan,
} from "@/lib/gantt-actual-timeline";
import type { GanttItem } from "@/types";

function item(
  partial: Partial<GanttItem> & Pick<GanttItem, "id">,
): GanttItem {
  return {
    title: partial.title ?? partial.id,
    startDate: partial.startDate ?? "2026-06-01T00:00:00.000Z",
    effectiveEnd: partial.effectiveEnd ?? partial.endDate ?? "2026-06-30T00:00:00.000Z",
    isVirtualEnd: partial.isVirtualEnd ?? false,
    parentId: partial.parentId ?? null,
    status: partial.status ?? "not_started",
    ...partial,
  };
}

describe("gantt actual timeline", () => {
  const now = "2026-07-10T12:00:00.000Z";

  it("uses actual end for completed child", () => {
    expect(
      getEffectiveActualEnd(
        item({
          id: "c",
          status: "done",
          actualEndDate: "2026-06-28T00:00:00.000Z",
        }),
        now,
      ),
    ).toBe("2026-06-28T00:00:00.000Z");
  });

  it("uses today for in-progress child without actual end", () => {
    expect(
      getEffectiveActualEnd(
        item({
          id: "c",
          status: "in_progress",
          actualStartDate: "2026-06-05T00:00:00.000Z",
        }),
        now,
      ),
    ).toBe(now);
  });

  it("uses today for not-started child past plan end", () => {
    expect(
      getEffectiveActualEnd(
        item({
          id: "c",
          status: "not_started",
          endDate: "2026-06-30T00:00:00.000Z",
        }),
        now,
      ),
    ).toBe(now);
  });

  it("does not count not-started child before plan end", () => {
    expect(
      getEffectiveActualEnd(
        item({
          id: "c",
          status: "not_started",
          endDate: "2026-07-30T00:00:00.000Z",
        }),
        "2026-07-10T12:00:00.000Z",
      ),
    ).toBeNull();
  });

  it("draws parent red when latest child actual exceeds parent plan end", () => {
    const parent = item({
      id: "p",
      endDate: "2026-06-30T00:00:00.000Z",
      effectiveEnd: "2026-06-30T00:00:00.000Z",
    });
    const items = [
      parent,
      item({
        id: "a",
        parentId: "p",
        status: "done",
        actualEndDate: "2026-06-20T00:00:00.000Z",
      }),
      item({
        id: "b",
        parentId: "p",
        status: "in_progress",
        actualStartDate: "2026-06-01T00:00:00.000Z",
      }),
    ];

    const fill = getParentActualExecutionFill(parent, items, now);
    expect(fill.red).toEqual({
      from: "2026-06-30T00:00:00.000Z",
      to: now,
    });
    expect(fill.green).toBeNull();
  });

  it("draws parent green only when all children done early", () => {
    const parent = item({
      id: "p",
      endDate: "2026-06-30T00:00:00.000Z",
      effectiveEnd: "2026-06-30T00:00:00.000Z",
    });
    const items = [
      parent,
      item({
        id: "a",
        parentId: "p",
        status: "done",
        actualEndDate: "2026-06-20T00:00:00.000Z",
      }),
      item({
        id: "b",
        parentId: "p",
        status: "done",
        actualEndDate: "2026-06-25T00:00:00.000Z",
      }),
    ];

    const fill = getParentActualExecutionFill(parent, items, now);
    expect(fill.green).toEqual({
      from: "2026-06-25T00:00:00.000Z",
      to: "2026-06-30T00:00:00.000Z",
    });
    expect(fill.red).toBeNull();
  });

  it("skips parent green while a child is still in progress", () => {
    const parent = item({
      id: "p",
      endDate: "2026-06-30T00:00:00.000Z",
      effectiveEnd: "2026-06-30T00:00:00.000Z",
    });
    const items = [
      parent,
      item({
        id: "a",
        parentId: "p",
        status: "done",
        actualEndDate: "2026-06-20T00:00:00.000Z",
      }),
      item({
        id: "b",
        parentId: "p",
        status: "in_progress",
        actualStartDate: "2026-06-18T00:00:00.000Z",
      }),
    ];

    const fill = getParentActualExecutionFill(parent, items, "2026-06-22T12:00:00.000Z");
    expect(fill.green).toBeNull();
    expect(fill.red).toBeNull();
  });

  it("returns execution span when actual start exists", () => {
    expect(
      getPlanActualExecutionSpan(
        item({
          id: "c",
          status: "in_progress",
          actualStartDate: "2026-06-05T09:00:00.000Z",
        }),
        now,
      ),
    ).toEqual({
      from: "2026-06-05T09:00:00.000Z",
      to: now,
    });
  });
});
