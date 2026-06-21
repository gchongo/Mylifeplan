import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONTRIBUTION_MARKER,
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
  resolveTimezone,
} from "@/lib/user-preferences";

describe("user preferences", () => {
  it("falls back to defaults for invalid values", () => {
    expect(
      normalizeUserPreferences({
        timezone: "",
        theme: "neon",
        language: "fr",
      }),
    ).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it("resolves auto timezone from Intl", () => {
    const tz = resolveTimezone("auto");
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });

  it("normalizes contribution marker preferences", () => {
    expect(
      normalizeUserPreferences({
        contributionMarker: { color: "#FF0000", size: "md", shape: "square" },
      }).contributionMarker,
    ).toEqual({ color: "#FF0000", size: "md", shape: "square" });
    expect(normalizeUserPreferences({}).contributionMarker).toEqual(DEFAULT_CONTRIBUTION_MARKER);
  });
});
