import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { existsSync } from "fs";
import process from "process";

const envFile = process.env.ENV ? `.env.${process.env.ENV}` : ".env";

dotenv.config({
  path: existsSync(envFile) ? envFile : ".env",
  quiet: true,
});

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
  ],
  use: {
    timezoneId: "Europe/London",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: process.env.CI ? "retain-on-failure" : "on-first-retry",
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
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.PROBATION_CHECK_IN_URL,
        ...(headed ? { viewport: null } : {}),
      },
    },
  ],
});
