import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /登录|MyLifePlan/i })).toBeVisible();
  });

  test("demo user can login and reach home", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/邮箱/i).fill("demo@mylifeplan.local");
    await page.getByLabel(/密码/i).fill("password123");
    await page.getByRole("button", { name: /登录/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText(/信息流|看动态/i)).toBeVisible();
  });

  test("admin login reaches user management", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/邮箱/i).fill("admin@mylifeplan.local");
    await page.getByLabel(/密码/i).fill("password123");
    await page.getByRole("button", { name: /登录/i }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByRole("heading", { name: "用户管理" })).toBeVisible();
  });
});
