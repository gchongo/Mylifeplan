import { z } from "zod";
import { validateDateFields } from "@/lib/content-router";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD")
  .optional()
  .nullable()
  .or(z.literal(""));

const taskBaseSchema = z.object({
  title: z.string().min(1, "标题必填").max(200),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(["todo", "in_progress", "done", "archived"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional().nullable(),
  startDate: optionalDate,
  dueDate: optionalDate,
  parentTaskId: z.string().optional().nullable(),
  planId: z.string().optional().nullable(),
});

function refineTaskDates(
  data: { startDate?: string | null; dueDate?: string | null },
  ctx: z.RefinementCtx,
) {
  const error = validateDateFields({
    startDate: data.startDate || undefined,
    dueDate: data.dueDate || undefined,
  });
  if (error) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ["dueDate"] });
  }
}

export const createTaskSchema = taskBaseSchema.superRefine(refineTaskDates);

/** PATCH 校验字段类型；日期组合由 service 层在合并现有值后校验 */
export const updateTaskSchema = taskBaseSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
