import { test, expect } from "@playwright/test";

// Helper: register and login
async function registerAndLogin(page: import("@playwright/test").Page) {
  const ts = Date.now();
  const email = `planner-test-${ts}@example.com`;
  await page.goto("/register");
  await page.getByPlaceholder("Your name").fill("Planner Test");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Min 8 characters").fill("Test1234!");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("**/planner**", { timeout: 15000 });
}

test.describe("Planner Page", () => {
  test("Eisenhower Matrix quadrants render", async ({ page }) => {
    await registerAndLogin(page);

    await expect(page.getByText("Do First")).toBeVisible();
    await expect(page.getByText("Schedule")).toBeVisible();
    await expect(page.getByText("Delegate")).toBeVisible();
    await expect(page.getByText("Eliminate")).toBeVisible();
  });

  test("Priority Grid heading is visible", async ({ page }) => {
    await registerAndLogin(page);
    await expect(page.getByText("Priority Grid")).toBeVisible();
  });

  test("voice recorder is present with provider toggle", async ({ page }) => {
    await registerAndLogin(page);
    await expect(page.getByText("Gemini").first()).toBeVisible();
  });

  test("team selector shows Personal option", async ({ page }) => {
    await registerAndLogin(page);
    // Default state: "Personal" button is active, "+ Team" link shown when no teams
    await expect(page.getByRole("button", { name: "Personal" })).toBeVisible();
  });

  test("Clear Day button is present", async ({ page }) => {
    await registerAndLogin(page);
    await expect(page.getByText("Clear Day")).toBeVisible();
  });
});
