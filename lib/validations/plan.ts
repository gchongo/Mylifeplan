import { z } from "zod";
import { validateDateFields } from "@/lib/content-router";

const optionalDateTime = z
  .string()
  .optional()
  .nullable()
  .or(z.literal(""))
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), "时间格式无效");

const planBaseSchema = z.object({
  title: z.string().min(1, "标题必填").max(200),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(["goal", "phase", "weekly", "daily"]).optional().default("goal"),
  parentPlanId: z.string().optional().nullable(),
  startDate: optionalDateTime,
  endDate: optionalDateTime,
  actualStartDate: optionalDateTime,
  actualEndDate: optionalDateTime,
  status: z.enum(["not_started", "in_progress", "done", "archived"]).optional(),
  /** 甘特拖动整条计划条时，是否同步平移所有子计划日期 */
  shiftDescendants: z.boolean().optional(),
  priority: z.enum(["high", "medium", "low"]).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "颜色格式无效")
    .optional()
    .nullable(),
});

function refinePlanDates(
  data: {
    startDate?: string | null;
    endDate?: string | null;
    actualStartDate?: string | null;
    actualEndDate?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  const error = validateDateFields({
    startDate: data.startDate || undefined,
    dueDate: data.endDate || undefined,
  });
  if (error) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ["endDate"] });
  }

  if (data.actualStartDate && data.actualEndDate) {
    const startMs = Date.parse(data.actualStartDate);
    const endMs = Date.parse(data.actualEndDate);
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs < startMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "实际结束时间不能早于实际开始时间",
        path: ["actualEndDate"],
      });
    }
  }
}

export const createPlanSchema = planBaseSchema.superRefine(refinePlanDates);

/** PATCH 校验字段类型；日期组合由 service 层在合并现有值后校验 */
export const updatePlanSchema = planBaseSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
