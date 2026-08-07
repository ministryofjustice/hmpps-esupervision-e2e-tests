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

  primaryButton(): Locator {
    return this.page
      .locator("main button.govuk-button, main a.govuk-button")
      .first();
  }

  async clickPrimaryButton(): Promise<void> {
    await this.primaryButton().click();
  }

  cymraegLink(): Locator {
    return this.page.getByRole("link", { name: "Cymraeg" });
  }

  async switchToWelsh(): Promise<void> {
    await this.cymraegLink().click();
  }

  async assertLanguage(lang: string): Promise<void> {
    await expect(this.page.locator("html")).toHaveAttribute("lang", lang);
  }
}
