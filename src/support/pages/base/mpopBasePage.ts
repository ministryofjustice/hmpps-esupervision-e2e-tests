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

  async clickRadioByName(qa: string, name: string): Promise<void> {
    await this.getQA(qa).getByRole("radio", { name }).check();
  }

  async submit(): Promise<void> {
    await this.continueButton();
  }

  async continueButton(): Promise<void> {
    const btn = this.page
      .locator('[data-qa="submitBtn"],[data-qa="submit-btn"]')
      .first();
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await btn.click();
  }

  async fillText(qa: string, note: string) {
    await this.getQA(qa).getByRole("textbox").clear();
    await this.getQA(qa).getByRole("textbox").fill(note);
  }

  summaryValueByKey(key: string | RegExp): Locator {
    return this.getClass("govuk-summary-list__row")
      .filter({
        has: this.page.locator(".govuk-summary-list__key", { hasText: key }),
      })
      .locator(".govuk-summary-list__value");
  }
}
