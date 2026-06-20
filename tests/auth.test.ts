import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("auth validations", () => {
  it("register rejects short password", () => {
    const result = registerSchema.safeParse({
      email: "a@b.com",
      password: "123",
      confirmPassword: "123",
    });
    expect(result.success).toBe(false);
  });

  it("register rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      email: "a@b.com",
      password: "password1",
      confirmPassword: "password2",
    });
    expect(result.success).toBe(false);
  });

  it("login accepts valid email", () => {
    const result = loginSchema.safeParse({
      email: "demo@mylifeplan.local",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("login accepts .local seed emails", () => {
    const result = loginSchema.safeParse({
      email: "admin@mylifeplan.local",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
});
