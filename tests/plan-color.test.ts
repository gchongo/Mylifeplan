import { describe, expect, it } from "vitest";
import {
  getPlanBarAppearance,
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

  it("frame root bar is transparent shell", () => {
    const bar = getPlanBarAppearance("#3B82F6", { frameRoot: true });
    expect(bar.shellClass).toContain("bg-transparent");
  });

  it("group frame uses plan color", () => {
    const frame = getPlanGroupFrameAppearance("#10B981");
    expect(frame.style.borderColor).toContain("rgba");
    expect(frame.style.backgroundColor).toContain("rgba");
  });
});
