import { expect, Page } from "@playwright/test";
import { env } from "../../../config/env";

export const loginToMpop = async (page: Page): Promise<void> => {
  await page.goto(env.mpopUrl());
  await expect(page).toHaveTitle(/HMPPS Digital Services - Sign in/);
  const username = env.deliusUsername();
  const password = env.deliusPassword();
  await page.fill("#username", username);
  await page.fill("#password", password);
  await page.click("#submit");
  await expect(page.locator('[data-qa="pageHeading"]')).toContainText(
    "Manage people on probation",
  );
};
