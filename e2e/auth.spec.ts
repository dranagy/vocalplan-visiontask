import { test, expect } from "@playwright/test";

const ts = Date.now();
const testEmail = `pw-test-${ts}@example.com`;
const testPassword = "Test1234!";

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create one" })).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
    await expect(page.getByPlaceholder("Your name")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Min 8 characters")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/planner");
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });

  test("register new user and auto-signin", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill("Playwright Test");
    await page.getByPlaceholder("you@example.com").fill(testEmail);
    await page.getByPlaceholder("Min 8 characters").fill(testPassword);
    await page.getByRole("button", { name: "Create Account" }).click();

    // Should redirect to planner after auto-signin
    await page.waitForURL("**/planner**", { timeout: 15000 });
    expect(page.url()).toContain("/planner");
  });

  test("logout redirects to login", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(testEmail);
    await page.getByPlaceholder("Enter your password").fill(testPassword);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/planner**", { timeout: 15000 });

    // Sign out
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(testEmail);
    await page.getByPlaceholder("Enter your password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should show error toast
    await expect(page.getByText("Invalid email or password")).toBeVisible({ timeout: 10000 });
  });
});
