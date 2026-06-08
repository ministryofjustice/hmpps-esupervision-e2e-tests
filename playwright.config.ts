import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv'
import process from 'process';


dotenv.config({ path: process.env.ENV ? `.env.${process.env.ENV}` : '.env' })

export default defineConfig({
  testDir: './src',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    timezoneId: 'Europe/London',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    launchOptions: {
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--use-file-for-fake-video-capture=./src/fixtures/mock-camera-capture.y4m',
      ],
    },
  },

  /* Configure projects for major browsers */
  projects: [
    //   {
    //   name: 'checkin:dev',
    //   testDir: './src/tests/steps',
    //   testIgnore: ['**/liveness-scenarios.spec.ts'],
    //   use: { ...devices['Desktop Chrome'], baseURL: process.env.PROBATION_CHECK_IN_URL },
    // },
    // ── Check-in UI — local (full liveness mock) ─────────────────────────
    {
      name: 'checkin:local',
      testDir: './src/tests/steps/checkin-ui/e2e',
      use: { ...devices['Desktop Chrome'], baseURL: process.env.PROBATION_CHECK_IN_URL },
    }
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
