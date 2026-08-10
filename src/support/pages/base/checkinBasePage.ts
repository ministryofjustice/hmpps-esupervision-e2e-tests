import { Locator, Page } from "@playwright/test";
import BasePage from "./basePage";

export default abstract class CheckinBasePage extends BasePage {
  readonly heading: string | RegExp;

  constructor(page: Page, heading: string | RegExp) {
    super(page);
    this.heading = heading;
  }

  mainHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  continueButton(): Locator {
    return this.page.getByRole("button", { name: "Continue" });
  }

  async clickContinue(): Promise<void> {
    await this.continueButton().click();
  }

  primaryButton(): Locator {
    return this.page
      .locator(
        "main button.govuk-button:not(.govuk-button--secondary), main a.govuk-button:not(.govuk-button--secondary)",
      )
      .first();
  }

  async clickPrimaryButton(): Promise<void> {
    await this.primaryButton().click();
  }
}
