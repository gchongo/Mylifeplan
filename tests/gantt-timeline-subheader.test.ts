import { describe, expect, it } from "vitest";
import { buildTimelineLayout } from "@/lib/gantt-scale";
import {
  buildTimelineSubheaderSpans,
  gregorianZodiacYear,
} from "@/lib/gantt-timeline-subheader";
import { DEFAULT_CALENDAR_WEEK_NUMBERS } from "@/lib/user-preferences";

describe("gantt timeline subheader", () => {
  it("merges day columns into four time periods", () => {
    const layout = buildTimelineLayout("day", "2025-06-20");
    const spans = buildTimelineSubheaderSpans(layout, DEFAULT_CALENDAR_WEEK_NUMBERS.format);
    expect(spans.slice(0, 4).map((s) => s.label)).toEqual([
      "凌晨",
      "上午",
      "下午",
      "夜晚",
    ]);
    expect(spans.slice(0, 4).map((s) => s.width)).toEqual([6 * 56, 6 * 56, 6 * 56, 6 * 56]);
  });

  it("shows weekday labels per column in week scale", () => {
    const layout = buildTimelineLayout("week", "2025-06-20");
    const spans = buildTimelineSubheaderSpans(layout, DEFAULT_CALENDAR_WEEK_NUMBERS.format);
    expect(spans.length).toBe(layout.columns.length);
    expect(spans.some((s) => s.label === "五")).toBe(true);
  });

  it("merges month day columns by ISO year week", () => {
    const layout = buildTimelineLayout("month", "2025-06-20");
    const spans = buildTimelineSubheaderSpans(layout, DEFAULT_CALENDAR_WEEK_NUMBERS.format);
    expect(spans.length).toBeLessThan(layout.columns.length);
    expect(spans.some((s) => s.label === "25")).toBe(true);
    expect(
      buildTimelineSubheaderSpans(layout, "week-label").some((s) => s.label === "第25周"),
    ).toBe(true);
  });

  it("merges year columns by month name", () => {
    const layout = buildTimelineLayout("year", "2025-06-20");
    const spans = buildTimelineSubheaderSpans(layout, DEFAULT_CALENDAR_WEEK_NUMBERS.format);
    expect(spans.some((s) => s.label === "六月")).toBe(true);
  });

  it("shows gregorian zodiac year labels on 5-year scale", () => {
    expect(gregorianZodiacYear(2024)).toBe("龙年");
    expect(gregorianZodiacYear(2025)).toBe("蛇年");
    const layout = buildTimelineLayout("5year", "2025-06-20");
    const spans = buildTimelineSubheaderSpans(layout, DEFAULT_CALENDAR_WEEK_NUMBERS.format);
    expect(spans.find((s) => s.label === "蛇年")).toBeTruthy();
  });
});
