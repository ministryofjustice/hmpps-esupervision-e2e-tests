import { expect, Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class RationalePage extends MPopBasePage {
  constructor(page: Page) {
    super(page, /suitable to use online check ins/i);
  }

  private rationalTextbox(): Locator {
    return this.page.getByLabel(this.heading);
  }

  async assertOnPage(timeout = 1000): Promise<void> {
    await expect(
      this.getQA("rationale-for-check-ins").getByRole("textbox"),
    ).toBeVisible({ timeout });
  }

  async completePage(rationale: string): Promise<void> {
    await this.rationalTextbox().fill(rationale);
    await this.clickContinue();
  }
}
