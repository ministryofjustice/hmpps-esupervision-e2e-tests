import { defineConfig, devices } from "@playwright/test";
import process from "process";
import { loadEnv } from "./src/config/loadEnv";
import { DASHBOARD_STORAGE_STATE } from "./src/support/utils/paths";

loadEnv();

const headed = process.argv.includes("--headed");

// Creates test data on demand; never part of a test run.
const dataSetupProject = {
  name: "data-setup",
  testDir: "./src/data-setup",
  testMatch: /.*\.setup\.ts/,
  workers: 1,
  // As checkin:dev: retry once past flaky OASys/Delius pages. A retry creates
  // a fresh CRN; the failed attempt's CRN stays in created-crns.txt.
  retries: 1,
  expect: { timeout: 15000 },
  use: {
    ...devices["Desktop Chrome"],
    actionTimeout: 30000,
    ...(headed ? { viewport: null } : {}),
  },
};

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 180000,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["github"],
    ["line"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "junit.xml" }],
    ["./src/support/utils/crnCleanupReporter.ts"],
  ],
  use: {
    timezoneId: "Europe/London",
    // Off in CI: trace leaks the Delius password typed via page.fill(); screenshot/video are masked but disabled too since they're only for local debugging.
    screenshot: process.env.CI ? "off" : "only-on-failure",
    video: process.env.CI ? "off" : "retain-on-failure",
    trace: process.env.CI ? "off" : "on-first-retry",
    permissions: ["camera", "microphone"],
    launchOptions: {
      args: [
        ...(headed ? ["--start-maximized"] : []),
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        "--use-file-for-fake-video-capture=./src/media/mock-camera-capture.y4m",
      ],
    },
  },
  projects: [
    {
      name: "checkin:dev",
      testDir: "./src/tests",
      testIgnore: ["**/dashboard/**"],
      // Specs share a single Delius account and pre-existing CRNs
      workers: 1,
      // NDelius test pages can take longer than the 5s default.
      expect: { timeout: 15000 },
      // One retry for OASys/NDelius steps that occasionally hang on slow pages
      retries: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.PROBATION_CHECK_IN_URL,
        // Fail a stuck click or fill after 30s instead of waiting for test timeout
        actionTimeout: 30000,
        ...(headed ? { viewport: null } : {}),
      },
    },
    // Only when asked for (npm run create:*), so no test run creates data.
    ...(process.env.DATA_SETUP ? [dataSetupProject] : []),
    {
      name: "dashboard-setup",
      testDir: "./src/tests/dashboard",
      testMatch: /dashboard\.setup\.ts/,
      teardown: "dashboard-teardown",
      use: {
        ...devices["Desktop Chrome"],
        ...(headed ? { viewport: null } : {}),
      },
    },
    {
      name: "dashboard-teardown",
      testDir: "./src/tests/dashboard",
      testMatch: /dashboard\.teardown\.ts/,
    },
    {
      name: "dashboard",
      testDir: "./src/tests/dashboard",
      testMatch: /.*\.spec\.ts/,
      dependencies: ["dashboard-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: DASHBOARD_STORAGE_STATE,
        ...(headed ? { viewport: null } : {}),
      },
    },
  ],
});
