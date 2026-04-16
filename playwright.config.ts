import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: "https://eisenhower-voice-planner.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    {
      name: "chromium-video",
      testDir: "./e2e",
      testMatch: ["**/teams.spec.ts", "**/team-collaboration.spec.ts"],
      use: {
        browserName: "chromium",
        video: "on",
      },
    },
  ],
});
