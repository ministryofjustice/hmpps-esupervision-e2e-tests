import { expect, Locator, Page } from "@playwright/test";
import BasePage from "../base/basePage";

export default abstract class CheckinBasePage extends BasePage {
  protected constructor(page: Page, title?: string | RegExp) {
    super(page, title);
  }


    async isOnPage(): Promise<boolean> {
    try {
      await expect(this.page.locator('h1')).toContainText(this.title ?? '', { timeout: 5000 })
      return true
    } catch { return false }
  }


  continueButton(): Locator {
    return this.page.locator('button', { hasText: 'Continue' })
  }

  async clickContinue(): Promise<void> {
    await this.continueButton().click()
  }
}
