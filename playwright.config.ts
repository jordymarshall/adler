import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  testMatch: "**/*.spec.ts",
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:5199",
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `NODE_ENV=test ADLER_DATA_DIR=.context/playwright-${Date.now()} npm run dev -- --port 5199 --strictPort`,
    url: "http://127.0.0.1:5199",
    reuseExistingServer: false,
  },
});
