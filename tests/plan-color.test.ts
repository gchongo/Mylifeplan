import { describe, expect, it } from "vitest";
import {
  getGroupColoredBarAppearance,
  getMobilePlanBarFillStyle,
  ganttPlanBarHeightPx,
  ganttPlanRowHeightPx,
  getPlanGroupFrameAppearance,
  normalizePlanColor,
  planColorRgba,
  resolveEffectivePlanColor,
  resolvePlanTreeGroupColor,
} from "@/lib/plan-color";
import { mobileBarTitleTopPadPx } from "@/components/gantt/gantt-mobile-bar-title";

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
    expect(bar.barHeightPx).toBe(30);
    expect(bar.statusDotClass).toContain("blue");
  });

  it("bar height decreases by depth level", () => {
    const root = getGroupColoredBarAppearance("#3B82F6", 0, "bg-blue-500 ring-blue-300");
    const child = getGroupColoredBarAppearance("#3B82F6", 1, "bg-emerald-500 ring-emerald-300");
    const grandchild = getGroupColoredBarAppearance("#3B82F6", 2, "bg-amber-500 ring-amber-300");
    expect(root.barHeightPx).toBe(30);
    expect(child.barHeightPx).toBe(24);
    expect(grandchild.barHeightPx).toBe(18);
    expect(child.barHeightPx).toBeLessThan(root.barHeightPx);
    expect(grandchild.barHeightPx).toBeLessThan(child.barHeightPx);
  });

  it("row height tracks bar height by depth", () => {
    expect(ganttPlanRowHeightPx(0)).toBeGreaterThan(ganttPlanBarHeightPx(0));
    expect(ganttPlanRowHeightPx(1)).toBeGreaterThan(ganttPlanBarHeightPx(1));
    expect(ganttPlanRowHeightPx(2)).toBeGreaterThan(ganttPlanBarHeightPx(2));
  });

  it("group frame shell is neutral", () => {
    const frame = getPlanGroupFrameAppearance("#10B981");
    expect(frame.className).toContain("slate");
  });

  it("sub-plan ignores its own color and inherits root", () => {
    expect(
      resolveEffectivePlanColor(
        { color: "#EF4444", parentId: "root-1" },
        { color: "#3B82F6" },
      ),
    ).toBe("#3B82F6");
  });

  it("resolvePlanTreeGroupColor walks to root plan", () => {
    const planById = new Map([
      ["root", { color: "#10B981", parentId: null }],
      ["mid", { color: "#EF4444", parentId: "root" }],
      ["leaf", { color: "#EC4899", parentId: "mid" }],
    ]);
    expect(resolvePlanTreeGroupColor(planById.get("leaf")!, planById)).toBe("#10B981");
  });

  it("mobile bar title top pad clears capsule radius", () => {
    expect(mobileBarTitleTopPadPx(30)).toBe(27);
    expect(mobileBarTitleTopPadPx(24)).toBe(24);
  });

  it("mobile bar fill matches PC group bar alpha by depth", () => {
    const pc = getGroupColoredBarAppearance("#3B82F6", 1, "dot", false);
    const mobile = getMobilePlanBarFillStyle("#3B82F6", 1);
    expect(mobile.backgroundColor).toBe(pc.shellStyle?.backgroundColor);
    expect(String(mobile.border)).toContain(String(pc.shellStyle?.borderColor));
  });
});
