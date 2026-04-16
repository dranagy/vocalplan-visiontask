import { test, expect } from "@playwright/test";

// Helper: register and login
async function registerAndLogin(page: import("@playwright/test").Page) {
  const ts = Date.now();
  const email = `teams-test-${ts}@example.com`;
  await page.goto("/register");
  await page.getByPlaceholder("Your name").fill("Teams Test");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Min 8 characters").fill("Test1234!");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("**/planner**", { timeout: 15000 });
}

test.describe("Teams Page", () => {
  test("page renders with Create Team and Join Team buttons", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/teams");

    await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Team" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Join Team" })).toBeVisible();
  });

  test("empty state shows when no teams", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/teams");

    await expect(page.getByText("You're not in any teams yet")).toBeVisible();
  });

  test("create a new team and verify it appears", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/teams");

    // Open create form
    await page.getByRole("button", { name: "Create Team" }).click();
    await expect(page.getByText("Create a new team")).toBeVisible();

    // Fill and submit — use the form's submit button specifically
    await page.getByPlaceholder("Team name").fill("Playwright Test Team");
    await page.locator("form").filter({ hasText: "Create a new team" }).getByRole("button", { name: "Create" }).click();

    // Verify team appears
    await expect(page.getByText("Playwright Test Team")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("1 members")).toBeVisible();
  });

  test("team card shows invite code", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/teams");

    await page.getByRole("button", { name: "Create Team" }).click();
    await page.getByPlaceholder("Team name").fill("Code Test Team");
    await page.locator("form").filter({ hasText: "Create a new team" }).getByRole("button", { name: "Create" }).click();

    // Invite code should appear (8-char alphanumeric in a mono font element)
    await expect(page.locator("span.font-mono.font-bold")).toBeVisible({ timeout: 10000 });
  });
});
