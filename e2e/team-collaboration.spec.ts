import { test, expect } from "@playwright/test";

const ts = Date.now();
const userAEmail = `collab-a-${ts}@example.com`;
const userBEmail = `collab-b-${ts}@example.com`;
const password = "Test1234!";
const teamName = `Collab Team ${ts}`;

// Shared state across serial tests
let inviteCode: string;
let teamId: string;

test.describe.serial("Team Collaboration Flow", () => {
  test("step 1: User A registers", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill("User A");
    await page.getByPlaceholder("you@example.com").fill(userAEmail);
    await page.getByPlaceholder("Min 8 characters").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForURL("**/planner**", { timeout: 15000 });
    expect(page.url()).toContain("/planner");
  });

  test("step 2: User A creates a team", async ({ page }) => {
    // Login as User A
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(userAEmail);
    await page.getByPlaceholder("Enter your password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/planner**", { timeout: 15000 });

    // Go to teams page
    await page.getByRole("link", { name: "Teams" }).click();
    await page.waitForURL("**/teams**");

    // Create team
    await page.getByRole("button", { name: "Create Team" }).click();
    await page.getByPlaceholder("Team name").fill(teamName);
    await page.locator("form").filter({ hasText: "Create a new team" }).getByRole("button", { name: "Create" }).click();

    // Verify team created and capture invite code
    await expect(page.getByText(teamName)).toBeVisible({ timeout: 10000 });
    const codeEl = page.locator("span.font-mono.font-bold").first();
    inviteCode = await codeEl.innerText();
    expect(inviteCode).toHaveLength(8);
  });

  test("step 3: User A creates tasks in the team context", async ({ page }) => {
    // Login as User A
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(userAEmail);
    await page.getByPlaceholder("Enter your password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/planner**", { timeout: 15000 });

    // Get the team ID from the teams API
    const teamsRes = await page.request.get("/api/teams");
    const teams = await teamsRes.json();
    const team = teams.find((t: { name: string }) => t.name === teamName);
    expect(team).toBeDefined();
    teamId = team.id;

    // Create tasks via the tasks API
    const today = new Date().toISOString().split("T")[0];
    const createRes = await page.request.post("/api/tasks", {
      data: {
        tasks: [
          { title: "Team task: Review PR", category: "URGENT_IMPORTANT", date: today, teamId: team.id },
          { title: "Team task: Update docs", category: "IMPORTANT_NOT_URGENT", date: today, teamId: team.id },
          { title: "Team task: Fix CI build", category: "URGENT_NOT_IMPORTANT", date: today, teamId: team.id },
        ],
      },
    });
    expect(createRes.status()).toBe(201);

    // Select the team from the team selector
    await page.getByRole("button", { name: "Personal" }).click();
    await page.getByRole("button", { name: new RegExp(teamName.slice(0, 15)) }).click();
    await page.waitForTimeout(2000);

    // Verify tasks appear in the matrix
    await expect(page.getByText("Review PR")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Update docs")).toBeVisible();
    await expect(page.getByText("Fix CI build")).toBeVisible();
  });

  test("step 4: User A logs out", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(userAEmail);
    await page.getByPlaceholder("Enter your password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/planner**", { timeout: 15000 });

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });

  test("step 5: User B registers a new account", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill("User B");
    await page.getByPlaceholder("you@example.com").fill(userBEmail);
    await page.getByPlaceholder("Min 8 characters").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForURL("**/planner**", { timeout: 15000 });
    expect(page.url()).toContain("/planner");
  });

  test("step 6: User B joins the team using invite code", async ({ page }) => {
    // Login as User B
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(userBEmail);
    await page.getByPlaceholder("Enter your password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/planner**", { timeout: 15000 });

    // Go to teams page
    await page.getByRole("link", { name: "Teams" }).click();
    await page.waitForURL("**/teams**");

    // Join team
    await page.getByRole("button", { name: "Join Team" }).click();
    await page.getByPlaceholder("Enter invite code").fill(inviteCode);
    await page.locator("form").filter({ hasText: "Join a team" }).getByRole("button", { name: "Join" }).click();

    // Verify team appears
    await expect(page.getByText(teamName)).toBeVisible({ timeout: 10000 });
    // Should show 2 members now
    await expect(page.getByText("2 members")).toBeVisible();
  });

  test("step 7: User B can see User A's tasks in the team", async ({ page }) => {
    // Login as User B
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(userBEmail);
    await page.getByPlaceholder("Enter your password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/planner**", { timeout: 15000 });

    // Select the team from the team selector
    await page.getByRole("button", { name: "Personal" }).click();
    await page.getByRole("button", { name: new RegExp(teamName.slice(0, 15)) }).click();
    await page.waitForTimeout(2000);

    // Verify User A's tasks are visible
    await expect(page.getByText("Review PR")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Update docs")).toBeVisible();
    await expect(page.getByText("Fix CI build")).toBeVisible();
  });
});
