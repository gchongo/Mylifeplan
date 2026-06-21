import { describe, expect, it } from "vitest";
import {
  isContributionInterval,
  resolveContributionMarkerColor,
  contributionMarkerHeight,
} from "@/lib/contribution-marker-style";

describe("contribution-marker-style", () => {
  const planById = new Map([
    ["root", { id: "root", parentId: null, color: "#10B981" }],
    ["child", { id: "child", parentId: "root", color: null }],
  ]);

  it("detects interval vs point contributions", () => {
    expect(
      isContributionInterval({
        occurredOn: "2026-06-01T10:00",
        occurredEndOn: "2026-06-03T10:00",
      }),
    ).toBe(true);
    expect(
      isContributionInterval({
        occurredOn: "2026-06-01T10:00",
        occurredEndOn: "2026-06-01T10:00",
      }),
    ).toBe(false);
    expect(
      isContributionInterval({
        occurredOn: "2026-06-01T10:00",
        occurredEndOn: null,
      }),
    ).toBe(false);
  });

  it("inherits root plan group color when markerColor is unset", () => {
    expect(
      resolveContributionMarkerColor({ planId: "child", markerColor: null }, planById),
    ).toBe("#10B981");
  });

  it("uses custom marker color when set", () => {
    expect(
      resolveContributionMarkerColor(
        { planId: "child", markerColor: "#EF4444" },
        planById,
      ),
    ).toBe("#EF4444");
  });

  it("marker height insets from bar height", () => {
    expect(contributionMarkerHeight(32)).toBe(28);
    expect(contributionMarkerHeight(22)).toBe(18);
  });
});
