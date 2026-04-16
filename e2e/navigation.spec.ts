import { test, expect } from "@playwright/test";

// Helper: register and login
async function registerAndLogin(page: import("@playwright/test").Page) {
  const ts = Date.now();
  const email = `nav-test-${ts}@example.com`;
  await page.goto("/register");
  await page.getByPlaceholder("Your name").fill("Nav Test");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Min 8 characters").fill("Test1234!");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("**/planner**", { timeout: 15000 });
}

test.describe("Navigation", () => {
  test("dashboard nav tabs are visible", async ({ page }) => {
    await registerAndLogin(page);

    await expect(page.getByRole("link", { name: "Planner" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Analytics" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Teams" })).toBeVisible();
  });

  test("clicking nav tabs navigates to correct pages", async ({ page }) => {
    await registerAndLogin(page);

    // Go to Analytics
    await page.getByRole("link", { name: "Analytics" }).click();
    await page.waitForURL("**/analytics**");
    expect(page.url()).toContain("/analytics");

    // Go to Teams
    await page.getByRole("link", { name: "Teams" }).click();
    await page.waitForURL("**/teams**");
    expect(page.url()).toContain("/teams");

    // Go back to Planner
    await page.getByRole("link", { name: "Planner" }).click();
    await page.waitForURL("**/planner**");
    expect(page.url()).toContain("/planner");
  });

  test("protected routes redirect to login when unauthenticated", async ({ page }) => {
    for (const route of ["/planner", "/analytics", "/teams"]) {
      await page.goto(route);
      await page.waitForURL("**/login**");
      expect(page.url()).toContain("/login");
    }
  });
});
