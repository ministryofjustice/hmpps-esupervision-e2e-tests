import { expect, Page } from "@playwright/test";
import { env } from "../../../config/env";

export const loginToMpop = async (page: Page): Promise<void> => {
  const username = env.deliusUsername();
  const password = env.deliusPassword();

  // MPOP intermittently renders "Sorry, there is a problem with the service"
  // instead of the dashboard straight after login; a retry of the whole
  // flow clears it.
  await expect(async () => {
    await page.goto(env.mpopUrl());
    await expect(page).toHaveTitle(/HMPPS Digital Services - Sign in/);
    await page.fill("#username", username);
    await page.fill("#password", password);
    await page.click("#submit");
    await expect(page.locator('[data-qa="pageHeading"]')).toContainText(
      "Manage people on probation",
    );
  }).toPass({ timeout: 30000, intervals: [2000, 5000, 10000] });
};
