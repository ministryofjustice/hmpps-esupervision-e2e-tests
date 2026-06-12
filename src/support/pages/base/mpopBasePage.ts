import { expect, Locator, Page } from "@playwright/test";

export default abstract class MPopBasePage {
  constructor(
    protected readonly page: Page,
    protected readonly heading: string | RegExp,
  ) {}

  getQA(qa: string, locator: Locator | Page = this.page): Locator {
    return locator.locator(`[data-qa="${qa}"]`);
  }
  getClass(cssClass: string, locator: Locator | Page = this.page): Locator {
    return locator.locator(`.${cssClass}`);
  }

  async assertOnPage(): Promise<void> {
    await expect(this.getQA("pageHeading")).toContainText(this.heading);
  }
  async clickRadioById(qa: string, id: number): Promise<void> {
    const radio = this.getQA(qa).getByRole("radio").nth(id);
    await expect(radio).toBeVisible();
    await radio.check();
    await expect(radio).toBeChecked();
  }

  async clickContinue(): Promise<void> {
    // the app has two ids for same button ("submitBtn and submit-btn")
    const btn = this.page
      .locator('[data-qa="submitBtn"],[data-qa="submit-btn"]')
      .first();
    await expect(btn).toBeEnabled();
    await btn.click();
  }

  async fillText(qa: string, note: string) {
    await this.getQA(qa).getByRole("textbox").clear();
    await this.getQA(qa).getByRole("textbox").fill(note);
  }
}
