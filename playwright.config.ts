import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv'
import process from 'process';

dotenv.config({ path: process.env.ENV ? `.env.${process.env.ENV}` : '.env' })

export default defineConfig({
  fullyParallel: true,
 forbidOnly: !!process.env.CI,
  retries: 0,
  timeout:60000,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    timezoneId: 'Europe/London',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    permissions: ['camera','microphone'], 
    launchOptions: {
      args:  
      [
         '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--use-file-for-fake-video-capture=./src/tests/test-data/mock-camera-capture.y4m',

      ],
    },
  },

  projects: [
      {
      name: 'checkin:dev',
      testDir:'./src/tests',
      use: { ...devices['Desktop Chrome'], baseURL: process.env.PROBATION_CHECK_IN_URL },
    }
  ]
});
