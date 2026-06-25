import { z } from "zod";

export const adminUserPatchSchema = z.object({
  isActive: z.boolean(),
});

export const adminSubscriptionPatchSchema = z.object({
  planName: z.string().min(1).max(100).optional(),
  billingPlanId: z.string().min(1).optional().nullable(),
  status: z.enum(["active", "expired", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

export const adminSubscriptionCreateSchema = z.object({
  userId: z.string().min(1),
  billingPlanId: z.string().min(1),
  status: z.enum(["active", "expired", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

export const billingPlanPatchSchema = z.object({
  nameZh: z.string().min(1).max(100).optional(),
  nameEn: z.string().min(1).max(100).optional(),
  maxPlans: z.number().int().min(0).nullable().optional(),
  maxStorageBytes: z.number().int().min(0).optional(),
  maxFileBytes: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type AdminUserPatchInput = z.infer<typeof adminUserPatchSchema>;
export type AdminSubscriptionPatchInput = z.infer<typeof adminSubscriptionPatchSchema>;
export type AdminSubscriptionCreateInput = z.infer<typeof adminSubscriptionCreateSchema>;
export type BillingPlanPatchInput = z.infer<typeof billingPlanPatchSchema>;
