import { defineConfig } from "@playwright/test";

const testData = process.env.ADLER_TEST_DATA_DIR ??= `.context/playwright-${Date.now()}`;

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
    command: `NODE_ENV=test ADLER_DATA_DIR=${testData} npm run dev -- --port 5199 --strictPort`,
    url: "http://127.0.0.1:5199",
    reuseExistingServer: false,
  },
});
