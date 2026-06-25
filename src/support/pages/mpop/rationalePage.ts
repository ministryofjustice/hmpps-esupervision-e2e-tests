import { expect, Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class RationalePage extends MPopBasePage {
  constructor(page: Page) {
    super(page, /suitable to use online check ins/i);
  }

  private rationalTextbox(): Locator {
    return this.getQA("rationale-for-check-ins").getByRole("textbox");
  }

  async assertOnPage(): Promise<void> {
    await expect(this.rationalTextbox()).toBeVisible();
  }

  async completePage(rationale: string): Promise<void> {
    await this.rationalTextbox().fill(rationale);
    await this.clickContinue();
  }
}
