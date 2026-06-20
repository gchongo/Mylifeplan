import { z } from "zod";
import { validateDateFields } from "@/lib/content-router";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD")
  .optional()
  .nullable();

export const taskDateSchema = z
  .object({
    startDate: optionalDate,
    dueDate: optionalDate,
  })
  .superRefine((data, ctx) => {
    const error = validateDateFields({
      startDate: data.startDate ?? undefined,
      dueDate: data.dueDate ?? undefined,
    });
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ["dueDate"] });
    }
  });

export const createTaskSchema = z.object({
  title: z.string().min(1, "标题必填").max(200),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional().nullable(),
  startDate: optionalDate,
  dueDate: optionalDate,
  parentTaskId: z.string().optional().nullable(),
  planId: z.string().optional().nullable(),
});

export const createPlanSchema = z.object({
  title: z.string().min(1, "标题必填").max(200),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(["goal", "phase", "weekly", "daily"]),
  parentPlanId: z.string().optional().nullable(),
  startDate: optionalDate,
  endDate: optionalDate,
  status: z.enum(["not_started", "in_progress", "done"]).optional(),
});

export const planDateSchema = z
  .object({
    startDate: optionalDate,
    endDate: optionalDate,
  })
  .superRefine((data, ctx) => {
    const error = validateDateFields({
      startDate: data.startDate ?? undefined,
      dueDate: data.endDate ?? undefined,
    });
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ["endDate"] });
    }
  });
