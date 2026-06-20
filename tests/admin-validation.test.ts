import { describe, expect, it } from "vitest";
import { adminSubscriptionPatchSchema, adminUserPatchSchema } from "@/lib/validations/admin";

describe("admin validations", () => {
  it("user patch requires isActive boolean", () => {
    expect(adminUserPatchSchema.safeParse({ isActive: true }).success).toBe(true);
    expect(adminUserPatchSchema.safeParse({ isActive: "yes" }).success).toBe(false);
  });

  it("subscription patch accepts partial fields", () => {
    const result = adminSubscriptionPatchSchema.safeParse({
      status: "expired",
      paymentStatus: "paid",
    });
    expect(result.success).toBe(true);
  });

  it("subscription patch rejects invalid status", () => {
    const result = adminSubscriptionPatchSchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });
});
