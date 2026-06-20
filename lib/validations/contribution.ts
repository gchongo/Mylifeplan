import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD");

const contributionBaseSchema = z.object({
  planId: z.string().min(1, "请选择计划"),
  title: z.string().min(1, "标题必填").max(200),
  description: z.string().max(5000).optional().nullable(),
  occurredOn: dateStr,
  occurredEndOn: dateStr.optional().nullable().or(z.literal("")),
});

function refineContributionDates(
  data: { occurredOn?: string; occurredEndOn?: string | null },
  ctx: z.RefinementCtx,
) {
  const end = data.occurredEndOn?.trim();
  if (end && data.occurredOn && end < data.occurredOn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "结束日期不能早于开始日期",
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
