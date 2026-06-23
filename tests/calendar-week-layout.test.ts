import { describe, expect, it } from "vitest";
import {
  buildMonthWeekRows,
  buildWeekMultiDaySegments,
  isMultiDayCalendarItem,
  singleDayItemsOnDate,
  weekDateStrings,
} from "@/lib/calendar-week-layout";
import type { CalendarItem } from "@/types";

function item(
  id: string,
  title: string,
  startDate: string,
  endDate?: string | null,
): CalendarItem {
  return { id, title, startDate, endDate: endDate ?? null, status: "in_progress" };
}

describe("calendar-week-layout", () => {
  it("detects multi-day items by date span", () => {
    expect(isMultiDayCalendarItem(item("1", "A", "2026-05-01", "2026-05-05"))).toBe(true);
    expect(isMultiDayCalendarItem(item("2", "B", "2026-05-01", "2026-05-01"))).toBe(false);
  });

  it("keeps single-day items per date only", () => {
    const items = [
      item("1", "劳动节", "2026-05-01", "2026-05-05"),
      item("2", "每日英", "2026-05-01", "2026-05-01"),
    ];
    expect(singleDayItemsOnDate(items, "2026-05-01").map((i) => i.id)).toEqual(["2"]);
    expect(singleDayItemsOnDate(items, "2026-05-02")).toHaveLength(0);
  });

  it("builds one merged segment for a multi-day plan within a week", () => {
    const week = weekDateStrings(2026, 4, [1, 2, 3, 4, 5, 6, 7]);
    const segments = buildWeekMultiDaySegments(week, [
      item("1", "劳动节", "2026-05-01T00:00:00.000Z", "2026-05-05T00:00:00.000Z"),
    ]);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      colStart: 0,
      colSpan: 5,
      showTitle: true,
      kind: "single",
    });
  });

  it("splits multi-day plans at week boundaries with continuation flags", () => {
    const week = weekDateStrings(2026, 4, [1, 2, 3, 4, 5, 6, 7]);
    const segments = buildWeekMultiDaySegments(week, [
      item("1", "长假", "2026-04-28", "2026-05-03"),
    ]);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      colStart: 0,
      colSpan: 3,
      showTitle: false,
      kind: "end",
    });
  });

  it("pads month cells into full week rows", () => {
    const rows = buildMonthWeekRows(2026, 4);
    expect(rows.every((row) => row.length === 7)).toBe(true);
    expect(rows[0]![0]).toBeNull();
    expect(rows[0]![4]).toBe(1);
  });
});
