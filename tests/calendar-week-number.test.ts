import { describe, expect, it } from "vitest";
import {
  buildMonthWeekRows,
  formatCalendarWeekNumber,
  isoWeekYearAndNumber,
  weekRowAnchorDate,
} from "@/lib/calendar-week-number";
import { DEFAULT_CALENDAR_WEEK_NUMBERS } from "@/lib/user-preferences";

describe("calendar week numbers", () => {
  it("groups month cells into full weeks", () => {
    const rows = buildMonthWeekRows(2025, 5);
    expect(rows.length).toBe(6);
    expect(rows.every((row) => row.length === 7)).toBe(true);
    expect(rows[0]!.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(rows[0]![6]).toBe(1);
  });

  it("computes ISO week numbers", () => {
    expect(isoWeekYearAndNumber("2025-01-01")).toEqual({ weekYear: 2025, week: 1 });
    expect(isoWeekYearAndNumber("2025-06-20")).toEqual({ weekYear: 2025, week: 25 });
  });

  it("anchors week rows on in-month days when present", () => {
    expect(weekRowAnchorDate(2025, 5, [null, null, null, null, null, null, 1], 0, 5)).toBe(
      "2025-06-01",
    );
    expect(weekRowAnchorDate(2025, 5, [29, 30, null, null, null, null, null], 4, 5)).toBe(
      "2025-06-29",
    );
  });

  it("formats ISO and month-ordinal labels", () => {
    const week = [null, null, null, null, null, null, 1];
    expect(
      formatCalendarWeekNumber(
        { ...DEFAULT_CALENDAR_WEEK_NUMBERS, mode: "iso", format: "number" },
        2025,
        5,
        week,
        0,
        5,
      ),
    ).toBe("22");
    expect(
      formatCalendarWeekNumber(
        { ...DEFAULT_CALENDAR_WEEK_NUMBERS, mode: "month-ordinal", format: "week-label" },
        2025,
        5,
        week,
        0,
        5,
      ),
    ).toBe("第1周");
  });
});
