import { defineConfig, devices } from "@playwright/test";
import process from "process";
import { loadEnv } from "./src/config/loadEnv";
import { DASHBOARD_STORAGE_STATE } from "./src/support/utils/paths";

loadEnv();

const headed = process.argv.includes("--headed");

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
      testIgnore: "**/dashboard/**",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.PROBATION_CHECK_IN_URL,
        ...(headed ? { viewport: null } : {}),
      },
    },
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
