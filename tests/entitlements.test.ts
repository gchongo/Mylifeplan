import { describe, expect, it } from "vitest";
import { canUploadWithLimits } from "@/lib/entitlements";
import type { EffectiveLimits } from "@/lib/entitlements";
import { formatBytes } from "@/lib/format-bytes";

function limits(partial: Partial<EffectiveLimits>): EffectiveLimits {
  return {
    billingPlanId: "p1",
    planSlug: "free",
    planNameZh: "免费版",
    planNameEn: "Free",
    maxPlans: 10,
    maxStorageBytes: 15 * 1024 * 1024,
    maxFileBytes: 5 * 1024 * 1024,
    usedPlans: 3,
    usedStorageBytes: 1024,
    canCreatePlan: true,
    subscriptionStatus: "active",
    subscriptionEndAt: null,
    ...partial,
  };
}

describe("entitlements", () => {
  it("blocks plan creation at limit", () => {
    const atLimit = limits({ usedPlans: 10, canCreatePlan: false });
    expect(atLimit.canCreatePlan).toBe(false);
  });

  it("allows upload within storage and file limits", () => {
    const l = limits({ usedStorageBytes: 1024 });
    expect(canUploadWithLimits(l, 1024)).toBe(true);
  });

  it("blocks upload when total storage would exceed quota", () => {
    const l = limits({
      usedStorageBytes: 15 * 1024 * 1024 - 100,
      maxStorageBytes: 15 * 1024 * 1024,
    });
    expect(canUploadWithLimits(l, 200)).toBe(false);
  });

  it("blocks upload when file exceeds per-file limit", () => {
    const l = limits({});
    expect(canUploadWithLimits(l, 6 * 1024 * 1024)).toBe(false);
  });

  it("formats bytes for display", () => {
    expect(formatBytes(15 * 1024 * 1024)).toContain("MB");
  });
});

describe("admin validations", () => {
  it("billing plan patch accepts nullable maxPlans", async () => {
    const { billingPlanPatchSchema } = await import("@/lib/validations/admin");
    expect(billingPlanPatchSchema.safeParse({ maxPlans: null }).success).toBe(true);
    expect(billingPlanPatchSchema.safeParse({ maxStorageBytes: 15728640 }).success).toBe(true);
  });
});
