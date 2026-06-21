import { z } from "zod";
import { validateDateFields } from "@/lib/content-router";

const optionalDateTime = z
  .string()
  .optional()
  .nullable()
  .or(z.literal(""))
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), "时间格式无效");

const requiredDateTime = z
  .string()
  .min(1, "请选择时间")
  .refine((v) => !Number.isNaN(Date.parse(v)), "时间格式无效");

const contributionBaseSchema = z.object({
  planId: z.string().min(1, "请选择计划"),
  title: z.string().min(1, "标题必填").max(200),
  description: z.string().max(5000).optional().nullable(),
  body: z.string().max(100_000).optional().nullable(),
  imageUrls: z.array(z.string().min(1)).max(20).optional(),
  occurredOn: requiredDateTime,
  occurredEndOn: optionalDateTime,
});

function refineContributionDates(
  data: { occurredOn?: string; occurredEndOn?: string | null },
  ctx: z.RefinementCtx,
) {
  const error = validateDateFields({
    startDate: data.occurredOn || undefined,
    dueDate: data.occurredEndOn || undefined,
  });
  if (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: error.replace("结束时间", "结束日期").replace("开始时间", "开始日期"),
      path: ["occurredEndOn"],
    });
  }
}

export const createContributionSchema = contributionBaseSchema.superRefine((data, ctx) =>
  refineContributionDates(data, ctx),
);

export const updateContributionSchema = contributionBaseSchema
  .partial()
  .superRefine((data, ctx) => refineContributionDates(data, ctx));

export type CreateContributionInput = z.infer<typeof createContributionSchema>;
