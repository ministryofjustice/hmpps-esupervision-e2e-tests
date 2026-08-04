import { test as base } from "@playwright/test";
import { DATA_DASHBOARD_PATH } from "../../../data/dashboard/routes";
import { assertNoBrokenValues } from "./dashboardTables";

export { expect } from "@playwright/test";

export const test = base.extend<{ noBrokenValues: void }>({
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
