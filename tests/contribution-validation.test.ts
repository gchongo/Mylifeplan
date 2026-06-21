import { describe, expect, it } from "vitest";
import { createContributionSchema } from "@/lib/validations/contribution";

describe("contribution validation", () => {
  it("accepts datetime-local with minute precision", () => {
    const parsed = createContributionSchema.safeParse({
      planId: "plan-1",
      title: "进展",
      occurredOn: "2026-06-20T14:30",
      occurredEndOn: "2026-06-20T16:45",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects end before start", () => {
    const parsed = createContributionSchema.safeParse({
      planId: "plan-1",
      title: "进展",
      occurredOn: "2026-06-20T16:00",
      occurredEndOn: "2026-06-20T14:00",
    });
    expect(parsed.success).toBe(false);
  });
});
