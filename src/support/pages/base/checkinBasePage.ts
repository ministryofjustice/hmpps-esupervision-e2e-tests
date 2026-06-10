import { expect, Locator, Page } from "@playwright/test";
import BasePage from "./basePage";

export default abstract class CheckinBasePage extends BasePage {
  protected readonly heading: string | RegExp;

  constructor(page: Page, heading: string | RegExp) {
    super(page);
    this.heading = heading;
  }

  async isOnPage(): Promise<void> {
    await expect(this.page.getByRole("heading", { level: 1 })).toContainText(
      this.heading,
    );
  }

  continueButton(): Locator {
    return this.page.getByRole("button", { name: "Continue" });
  }

  async clickContinue(): Promise<void> {
    await this.continueButton().click();
  }
}
