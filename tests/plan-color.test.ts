import { describe, expect, it } from "vitest";
import {
  getGroupColoredBarAppearance,
  getPlanGroupFrameAppearance,
  normalizePlanColor,
  planColorRgba,
} from "@/lib/plan-color";

describe("plan-color", () => {
  it("normalizes invalid color to default", () => {
    expect(normalizePlanColor(null)).toBe("#6366F1");
    expect(normalizePlanColor("bad")).toBe("#6366F1");
  });

  it("builds rgba from hex", () => {
    expect(planColorRgba("#FF0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
  });

  it("group colored bar uses plan group color and status dot", () => {
    const bar = getGroupColoredBarAppearance("#3B82F6", 0, "bg-blue-500 ring-blue-300");
    expect(bar.shellStyle?.backgroundColor).toContain("rgba");
    expect(bar.barHeightPx).toBe(32);
    expect(bar.statusDotClass).toContain("blue");
  });

  it("child bar is thinner than root", () => {
    const root = getGroupColoredBarAppearance("#3B82F6", 0, "bg-blue-500 ring-blue-300");
    const child = getGroupColoredBarAppearance("#3B82F6", 1, "bg-emerald-500 ring-emerald-300");
    expect(child.barHeightPx).toBeLessThan(root.barHeightPx);
  });

  it("group frame shell is neutral", () => {
    const frame = getPlanGroupFrameAppearance("#10B981");
    expect(frame.className).toContain("slate");
  });
});
