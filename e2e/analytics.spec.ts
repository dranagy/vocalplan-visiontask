import { test, expect } from "@playwright/test";

// Helper: register and login
async function registerAndLogin(page: import("@playwright/test").Page) {
  const ts = Date.now();
  const email = `analytics-test-${ts}@example.com`;
  await page.goto("/register");
  await page.getByPlaceholder("Your name").fill("Analytics Test");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Min 8 characters").fill("Test1234!");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("**/planner**", { timeout: 15000 });
}

test.describe("Analytics Page", () => {
  test("page renders with stats cards", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/analytics");

    // Should show analytics heading or stats
    await expect(page.getByText("Total Tasks")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Completed")).toBeVisible();
  });

  test("time range selector is clickable", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/analytics");

    // Time range buttons use full labels: "7 Days", "30 Days", "90 Days"
    await expect(page.getByRole("button", { name: "7 Days" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "30 Days" })).toBeVisible();
    await expect(page.getByRole("button", { name: "90 Days" })).toBeVisible();

    // Click 90 Days
    await page.getByRole("button", { name: "90 Days" }).click();
  });
});
