import { z } from "zod";

export const adminUserPatchSchema = z.object({
  isActive: z.boolean(),
});

export const adminSubscriptionPatchSchema = z.object({
  planName: z.string().min(1).max(100).optional(),
  status: z.enum(["active", "expired", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

export type AdminUserPatchInput = z.infer<typeof adminUserPatchSchema>;
export type AdminSubscriptionPatchInput = z.infer<typeof adminSubscriptionPatchSchema>;
