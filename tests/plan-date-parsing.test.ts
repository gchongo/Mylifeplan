import { describe, expect, it } from "vitest";
import {
  normalizePlanDateInput,
  parsePlanEndDateTime,
  parsePlanStartDateTime,
} from "@/lib/dates";

describe("plan date parsing", () => {
  it("uses start of day for start fields when only a date is given", () => {
    const d = parsePlanStartDateTime("2026-06-20");
    expect(d?.getHours()).toBe(0);
    expect(d?.getMinutes()).toBe(0);
  });

  it("uses end of day for end fields when only a date is given", () => {
    const d = parsePlanEndDateTime("2026-06-20");
    expect(d?.getHours()).toBe(23);
    expect(d?.getMinutes()).toBe(59);
  });

  it("treats datetime-local midnight on end fields as end of day", () => {
    expect(normalizePlanDateInput("2026-06-20T00:00", "end")).toBe("2026-06-20T23:59");
    const d = parsePlanEndDateTime("2026-06-20T00:00");
    expect(d?.getHours()).toBe(23);
    expect(d?.getMinutes()).toBe(59);
  });

  it("keeps explicit times on end fields", () => {
    const d = parsePlanEndDateTime("2026-06-20T15:30");
    expect(d?.getHours()).toBe(15);
    expect(d?.getMinutes()).toBe(30);
  });
});
