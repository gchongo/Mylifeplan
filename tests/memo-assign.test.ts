import { describe, expect, it } from "vitest";
import { validateDateFields } from "@/lib/content-router";
import { parsePlanDateTime } from "@/lib/dates";

describe("memo assign to plan", () => {
  it("accepts datetime-local with minute precision", () => {
    expect(
      validateDateFields({
        startDate: "2026-06-20T14:30",
        dueDate: "2026-06-20T16:45",
      }),
    ).toBeNull();
    const start = parsePlanDateTime("2026-06-20T14:30");
    expect(start).not.toBeNull();
    expect(start!.getMinutes()).toBe(30);
  });

  it("rejects end before start", () => {
    expect(
      validateDateFields({
        startDate: "2026-06-20T16:00",
        dueDate: "2026-06-20T14:00",
      }),
    ).toBe("结束时间不能早于开始时间");
  });
});
