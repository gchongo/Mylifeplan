import { z } from "zod";
import { validateDateFields } from "@/lib/content-router";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD")
  .optional()
  .nullable()
  .or(z.literal(""));

export const createPlanSchema = z
  .object({
    title: z.string().min(1, "标题必填").max(200),
    description: z.string().max(5000).optional().nullable(),
    type: z.enum(["goal", "phase", "weekly", "daily"]),
    parentPlanId: z.string().optional().nullable(),
    startDate: optionalDate,
    endDate: optionalDate,
    status: z.enum(["not_started", "in_progress", "done"]).optional(),
  })
  .superRefine((data, ctx) => {
    const start = data.startDate || null;
    const end = data.endDate || null;
    const error = validateDateFields({
      startDate: start ?? undefined,
      dueDate: end ?? undefined,
    });
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ["endDate"] });
    }
  });

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
