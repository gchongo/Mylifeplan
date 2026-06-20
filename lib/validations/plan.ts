import { z } from "zod";
import { validateDateFields } from "@/lib/content-router";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD")
  .optional()
  .nullable()
  .or(z.literal(""));

const planBaseSchema = z.object({
  title: z.string().min(1, "标题必填").max(200),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(["goal", "phase", "weekly", "daily"]),
  parentPlanId: z.string().optional().nullable(),
  startDate: optionalDate,
  endDate: optionalDate,
  status: z.enum(["not_started", "in_progress", "done"]).optional(),
});

function refinePlanDates(
  data: { startDate?: string | null; endDate?: string | null },
  ctx: z.RefinementCtx,
) {
  const error = validateDateFields({
    startDate: data.startDate || undefined,
    dueDate: data.endDate || undefined,
  });
  if (error) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ["endDate"] });
  }
}

export const createPlanSchema = planBaseSchema.superRefine(refinePlanDates);

/** PATCH 校验字段类型；日期组合由 service 层在合并现有值后校验 */
export const updatePlanSchema = planBaseSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
