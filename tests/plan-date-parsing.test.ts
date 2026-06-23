import { describe, expect, it } from "vitest";
import {
  normalizePlanDateInput,
  parsePlanEndDateTime,
  parsePlanStartDateTime,
} from "@/lib/dates";

describe("plan date parsing", () => {
  it("uses start of day for start fields when only a date is given", () => {
    const d = parsePlanStartDateTime("2026-06-20");
    expect(d?.toISOString()).toBe("2026-06-19T16:00:00.000Z");
  });

  it("uses end of day for end fields when only a date is given", () => {
    const d = parsePlanEndDateTime("2026-06-20");
    expect(d?.toISOString()).toBe("2026-06-20T15:59:59.999Z");
  });

  it("treats datetime-local midnight on end fields as end of day", () => {
    expect(normalizePlanDateInput("2026-06-20T00:00", "end")).toBe("2026-06-20T23:59");
    const d = parsePlanEndDateTime("2026-06-20T00:00");
    expect(d?.toISOString()).toBe("2026-06-20T15:59:59.999Z");
  });

  it("keeps explicit times on end fields", () => {
    const d = parsePlanEndDateTime("2026-06-20T15:30");
    expect(d?.toISOString()).toBe("2026-06-20T07:30:00.000Z");
  });

  it("parses naive datetime on server as China wall clock (not UTC)", () => {
    const d = parsePlanStartDateTime("2026-06-23T19:58");
    expect(d?.toISOString()).toBe("2026-06-23T11:58:00.000Z");
  });
});
