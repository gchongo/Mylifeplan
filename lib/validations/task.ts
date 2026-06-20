import { z } from "zod";
import { validateDateFields } from "@/lib/content-router";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD")
  .optional()
  .nullable()
  .or(z.literal(""));

export const createTaskSchema = z
  .object({
    title: z.string().min(1, "标题必填").max(200),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(["todo", "in_progress", "done"]).optional(),
    priority: z.enum(["high", "medium", "low"]).optional().nullable(),
    startDate: optionalDate,
    dueDate: optionalDate,
    parentTaskId: z.string().optional().nullable(),
    planId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const start = data.startDate || null;
    const due = data.dueDate || null;
    const error = validateDateFields({
      startDate: start ?? undefined,
      dueDate: due ?? undefined,
    });
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ["dueDate"] });
    }
  });

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
