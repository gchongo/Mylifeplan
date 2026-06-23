import { describe, expect, it } from "vitest";
import {
  CALENDAR_DRAWER_MIN_WIDTH_PX,
  clampCalendarDrawerWidthPx,
  maxCalendarDrawerWidthPx,
} from "@/lib/calendar-display";

describe("calendar drawer width", () => {
  it("limits max width so calendar area stays at least as wide as tall", () => {
    expect(maxCalendarDrawerWidthPx(800, 500)).toBe(300);
    expect(maxCalendarDrawerWidthPx(500, 500)).toBe(CALENDAR_DRAWER_MIN_WIDTH_PX);
  });

  it("clamps requested width between min and layout-derived max", () => {
    expect(clampCalendarDrawerWidthPx(400, 800, 500)).toBe(300);
    expect(clampCalendarDrawerWidthPx(120, 800, 500)).toBe(CALENDAR_DRAWER_MIN_WIDTH_PX);
    expect(clampCalendarDrawerWidthPx(260, 800, 500)).toBe(260);
  });
});
