import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD");

export const createContributionSchema = z.object({
  planId: z.string().min(1, "请选择计划"),
  title: z.string().min(1, "标题必填").max(200),
  description: z.string().max(5000).optional().nullable(),
  occurredOn: dateStr,
});

export const updateContributionSchema = createContributionSchema.partial();

export type CreateContributionInput = z.infer<typeof createContributionSchema>;
