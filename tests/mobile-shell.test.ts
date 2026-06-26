import { describe, expect, it } from "vitest";
import { isMobileTabPath, shouldShowMobileTabBar } from "@/lib/mobile-shell";

describe("mobile-shell", () => {
  it("recognizes mobile tab routes", () => {
    expect(isMobileTabPath("/feed")).toBe(true);
    expect(isMobileTabPath("/settings")).toBe(false);
  });

  it("shows tab bar only on mobile shell main routes", () => {
    expect(shouldShowMobileTabBar("/feed", true)).toBe(true);
    expect(shouldShowMobileTabBar("/feed", false)).toBe(false);
    expect(shouldShowMobileTabBar("/settings", true)).toBe(false);
  });
});
