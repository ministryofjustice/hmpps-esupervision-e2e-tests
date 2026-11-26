import { expect, Page } from "@playwright/test";
import { env } from "../../../config/env";
import SignInPage, { retryFailedSignIn } from "../base/signInPage";

class MpopLoginPage {
  constructor(private readonly page: Page) {}

  serviceUnavailableMessage() {
    return this.page.getByText(/sorry[\s\S]*service unavailable/i);
  }

  async open(): Promise<void> {
    await this.page.goto(env.mpopUrl());
    if (
      await this.serviceUnavailableMessage()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await this.page.reload();
    }
  }
}

export const loginToMpop = async (page: Page): Promise<void> => {
  const loginPage = new MpopLoginPage(page);
  await loginPage.open();
  await new SignInPage(page).completeSignIn();
  await retryFailedSignIn(page, env.mpopUrl());

  // Sign in to manage online check ins now, where a failure can be retried,
  // not when a test first follows a link to it. Its homepage goes to MPOP's.
  await page.goto(env.manageCheckinsUiUrl());
  await retryFailedSignIn(page, env.manageCheckinsUiUrl());
  await expect(page.locator('[data-qa="pageHeading"]')).toContainText(
    "Manage people on probation",
  );
};
