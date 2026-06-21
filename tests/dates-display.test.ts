import { describe, expect, it } from "vitest";
import { formatPlanDateTimeDisplay, localDateStr, todayStr } from "@/lib/dates";

describe("local dates", () => {
  it("todayStr uses local calendar date", () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const expected = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    expect(todayStr()).toBe(expected);
    expect(localDateStr(d)).toBe(expected);
  });

  it("formatPlanDateTimeDisplay always includes minutes", () => {
    expect(formatPlanDateTimeDisplay("2026-05-03T00:00:00.000Z")).toBe("2026-05-03 00:00");
    expect(formatPlanDateTimeDisplay("2026-06-21")).toBe("2026-06-21 00:00");
  });
});
