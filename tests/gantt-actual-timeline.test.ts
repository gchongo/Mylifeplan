import { describe, expect, it } from "vitest";
import {
  getEffectiveActualEnd,
  getPlanActualExecutionFill,
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

  it("does not use today for completed child without actual end", () => {
    expect(
      getEffectiveActualEnd(
        item({
          id: "c",
          status: "done",
          endDate: "2026-06-25T00:00:00.000Z",
        }),
        now,
      ),
    ).toBe("2026-06-25T00:00:00.000Z");
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

    const fill = getPlanActualExecutionFill(parent, items, now);
    expect(fill.red).toEqual({
      from: "2026-06-30T00:00:00.000Z",
      to: now,
      endKind: "fixed",
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
        actualStartDate: "2026-06-01T00:00:00.000Z",
        actualEndDate: "2026-06-20T00:00:00.000Z",
      }),
      item({
        id: "b",
        parentId: "p",
        status: "done",
        actualStartDate: "2026-06-05T00:00:00.000Z",
        actualEndDate: "2026-06-25T00:00:00.000Z",
      }),
    ];

    const fill = getPlanActualExecutionFill(parent, items, now);
    expect(fill.green).toEqual({
      from: "2026-06-25T00:00:00.000Z",
      to: "2026-06-30T00:00:00.000Z",
      endKind: "fixed",
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

    const fill = getPlanActualExecutionFill(parent, items, "2026-06-22T12:00:00.000Z");
    expect(fill.green).toBeNull();
    expect(fill.red).toBeNull();
  });

  it("returns open execution span for in-progress leaf", () => {
    const items = [
      item({
        id: "c",
        status: "in_progress",
        actualStartDate: "2026-06-05T09:00:00.000Z",
      }),
    ];
    expect(getPlanActualExecutionSpan(items[0]!, items, now)).toEqual({
      from: "2026-06-05T09:00:00.000Z",
      to: now,
      endKind: "open",
    });
  });

  it("aggregates parent open ray to today when not all children have bounds", () => {
    const parent = item({ id: "p" });
    const items = [
      parent,
      item({
        id: "a",
        parentId: "p",
        status: "done",
        actualStartDate: "2026-06-01T00:00:00.000Z",
        actualEndDate: "2026-06-15T00:00:00.000Z",
      }),
      item({
        id: "b",
        parentId: "p",
        status: "in_progress",
        actualStartDate: "2026-06-10T00:00:00.000Z",
      }),
    ];

    expect(getPlanActualExecutionSpan(parent, items, now)).toEqual({
      from: "2026-06-01T00:00:00.000Z",
      to: now,
      endKind: "open",
    });
  });

  it("aggregates parent fixed span only when every child has actual start and end", () => {
    const parent = item({ id: "p" });
    const items = [
      parent,
      item({
        id: "a",
        parentId: "p",
        status: "done",
        actualStartDate: "2026-06-01T00:00:00.000Z",
        actualEndDate: "2026-06-15T00:00:00.000Z",
      }),
      item({
        id: "b",
        parentId: "p",
        status: "done",
        actualStartDate: "2026-06-10T00:00:00.000Z",
        actualEndDate: "2026-06-25T00:00:00.000Z",
      }),
    ];

    expect(getPlanActualExecutionSpan(parent, items, now)).toEqual({
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-25T00:00:00.000Z",
      endKind: "fixed",
    });
  });

  it("skips parent span when no child has actual start", () => {
    const parent = item({ id: "p" });
    const items = [
      parent,
      item({ id: "a", parentId: "p", status: "in_progress" }),
      item({ id: "b", parentId: "p", status: "not_started" }),
    ];
    expect(getPlanActualExecutionSpan(parent, items, now)).toBeNull();
  });

  it("uses open ray when a child is still in progress", () => {
    const parent = item({ id: "p" });
    const items = [
      parent,
      item({
        id: "a",
        parentId: "p",
        status: "done",
        actualStartDate: "2026-06-01T00:00:00.000Z",
        actualEndDate: "2026-06-15T00:00:00.000Z",
      }),
      item({
        id: "b",
        parentId: "p",
        status: "in_progress",
        actualStartDate: "2026-06-05T00:00:00.000Z",
      }),
    ];
    expect(getPlanActualExecutionSpan(parent, items, now)?.endKind).toBe("open");
    expect(getPlanActualExecutionSpan(parent, items, now)?.to).toBe(now);
  });

  it("uses fixed end when all children are done even without stored actual starts", () => {
    const parent = item({ id: "p" });
    const items = [
      parent,
      item({
        id: "a",
        parentId: "p",
        status: "done",
        startDate: "2026-06-01T00:00:00.000Z",
        endDate: "2026-06-15T00:00:00.000Z",
        actualEndDate: "2026-06-14T00:00:00.000Z",
      }),
      item({
        id: "b",
        parentId: "p",
        status: "done",
        startDate: "2026-06-05T00:00:00.000Z",
        endDate: "2026-06-20T00:00:00.000Z",
        actualEndDate: "2026-06-18T00:00:00.000Z",
      }),
    ];
    expect(getPlanActualExecutionSpan(parent, items, now)).toEqual({
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-18T00:00:00.000Z",
      endKind: "fixed",
    });
  });

  it("returns open ray when actual start is set but end is not (not_started)", () => {
    const items = [
      item({
        id: "c",
        status: "not_started",
        endDate: "2026-06-25T00:00:00.000Z",
        actualStartDate: "2026-06-18T00:00:00.000Z",
      }),
    ];
    expect(getPlanActualExecutionSpan(items[0]!, items, "2026-06-22T12:00:00.000Z")).toEqual({
      from: "2026-06-18T00:00:00.000Z",
      to: "2026-06-22T12:00:00.000Z",
      endKind: "open",
    });
  });

  it("does not use planned end when done without actual end", () => {
    const items = [
      item({
        id: "c",
        status: "done",
        endDate: "2026-06-25T00:00:00.000Z",
        actualStartDate: "2026-06-18T00:00:00.000Z",
      }),
    ];
    expect(getPlanActualExecutionSpan(items[0]!, items, now)).toBeNull();
  });

  it("draws leaf red when actual end is after plan end", () => {
    const leaf = item({
      id: "c",
      endDate: "2026-06-25T00:00:00.000Z",
      actualEndDate: "2026-06-28T00:00:00.000Z",
    });
    const fill = getPlanActualExecutionFill(leaf, [leaf], now);
    expect(fill.red).toEqual({
      from: "2026-06-25T00:00:00.000Z",
      to: "2026-06-28T00:00:00.000Z",
      endKind: "fixed",
    });
    expect(fill.green).toBeNull();
  });

  it("draws leaf green when actual end is before plan end", () => {
    const leaf = item({
      id: "c",
      endDate: "2026-06-30T00:00:00.000Z",
      actualEndDate: "2026-06-22T00:00:00.000Z",
    });
    const fill = getPlanActualExecutionFill(leaf, [leaf], now);
    expect(fill.green).toEqual({
      from: "2026-06-22T00:00:00.000Z",
      to: "2026-06-30T00:00:00.000Z",
      endKind: "fixed",
    });
    expect(fill.red).toBeNull();
  });

  it("skips leaf fill without actual end", () => {
    const leaf = item({
      id: "c",
      status: "in_progress",
      endDate: "2026-06-30T00:00:00.000Z",
      actualStartDate: "2026-06-05T00:00:00.000Z",
    });
    expect(getPlanActualExecutionFill(leaf, [leaf], now)).toEqual({
      green: null,
      red: null,
    });
  });

  describe("plan window vs today", () => {
    const today = "2026-07-10T12:00:00.000Z";

    it("overdue plan: no line without actual start", () => {
      const leaf = item({
        id: "c",
        status: "not_started",
        startDate: "2026-06-01T00:00:00.000Z",
        endDate: "2026-06-30T00:00:00.000Z",
      });
      expect(getPlanActualExecutionSpan(leaf, [leaf], today)).toBeNull();
    });

    it("overdue plan: open ray to today when actual start exists", () => {
      const leaf = item({
        id: "c",
        status: "in_progress",
        startDate: "2026-06-01T00:00:00.000Z",
        endDate: "2026-06-30T00:00:00.000Z",
        actualStartDate: "2026-06-05T00:00:00.000Z",
      });
      expect(getPlanActualExecutionSpan(leaf, [leaf], today)).toEqual({
        from: "2026-06-05T00:00:00.000Z",
        to: today,
        endKind: "open",
      });
    });

    it("future plan: no line without actual start", () => {
      const leaf = item({
        id: "c",
        status: "not_started",
        startDate: "2026-07-20T00:00:00.000Z",
        endDate: "2026-07-30T00:00:00.000Z",
      });
      expect(getPlanActualExecutionSpan(leaf, [leaf], today)).toBeNull();
    });

    it("future plan: no line when actual start is still in the future", () => {
      const leaf = item({
        id: "c",
        status: "in_progress",
        startDate: "2026-07-20T00:00:00.000Z",
        endDate: "2026-07-30T00:00:00.000Z",
        actualStartDate: "2026-07-15T00:00:00.000Z",
      });
      expect(getPlanActualExecutionSpan(leaf, [leaf], today)).toBeNull();
    });

    it("spanning plan: open ray to today when in progress with actual start", () => {
      const leaf = item({
        id: "c",
        status: "in_progress",
        startDate: "2026-07-01T00:00:00.000Z",
        endDate: "2026-07-30T00:00:00.000Z",
        actualStartDate: "2026-07-05T00:00:00.000Z",
      });
      expect(getPlanActualExecutionSpan(leaf, [leaf], today)).toEqual({
        from: "2026-07-05T00:00:00.000Z",
        to: today,
        endKind: "open",
      });
    });
  });
});
