import fs from "fs";
import { test as base } from "@playwright/test";
import { env } from "../../../config/env";
import { DATA_DASHBOARD_PATH } from "../../../data/dashboard/routes";
import { assertNoBrokenValues } from "./dashboardTables";
import DashboardJourney from "../../journeys/dashboard/dashboardJourney";
import { DASHBOARD_STORAGE_STATE } from "../paths";

export { expect } from "@playwright/test";

export const test = base.extend<{ noBrokenValues: void }>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires this destructuring shape.
  baseURL: async ({}, use) => {
    await use(env.dashboardUrl());
  },
  storageState: async ({ browser }, use) => {
    if (!fs.existsSync(DASHBOARD_STORAGE_STATE)) {
      const context = await browser.newContext({
        baseURL: env.dashboardUrl(),
      });
      const page = await context.newPage();
      await new DashboardJourney(page).signIn();
      await context.close();
    }
    await use(DASHBOARD_STORAGE_STATE);
  },
  noBrokenValues: [
    async ({ page }, use, testInfo) => {
      await use();
      if (testInfo.status !== testInfo.expectedStatus) return;
      if (page.isClosed()) return;
      if (!page.url().includes(DATA_DASHBOARD_PATH)) return;
      await assertNoBrokenValues(page);
    },
    { auto: true },
  ],
});
