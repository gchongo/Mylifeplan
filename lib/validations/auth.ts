import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().email("请输入有效邮箱"),
    password: z.string().min(8, "密码至少 8 位"),
    confirmPassword: z.string(),
    name: z.string().max(50).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
  password: z.string().min(1, "请输入密码"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
