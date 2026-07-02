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

  summaryValueByKey(key: string): Locator {
    return this.page
      .locator(".govuk-summary-list__key", { hasText: key })
      .locator("..")
      .locator(".govuk-summary-list__value");
  }

  summaryValueContaining(text: string): Locator {
    return this.getClass("govuk-summary-list__value").filter({
      hasText: text,
    });
  }

  async assertOnPage(timeout = 10000): Promise<void> {
    await expect(this.getQA("pageHeading")).toContainText(this.heading, {
      timeout,
    });
  }
  async clickRadioById(qa: string, id: number): Promise<void> {
    const radio = this.getQA(qa).getByRole("radio").nth(id);
    await expect(radio).toBeVisible();
    await radio.check();
  }

  async clickRadioByName(qa: string, label: string): Promise<void> {
    const radio = this.getQA(qa).getByRole("radio", { name: label });
    await expect(radio).toBeVisible();
    await radio.check();
  }

  async clickRadioByValue(qa: string, value: string): Promise<void> {
    const radio = this.getQA(qa).locator(`input[value="${value}"]`);
    await expect(radio).toBeVisible();
    await radio.check();
  }

  async clickContinue(): Promise<void> {
    // the app has two data-qa for same button ("submitBtn and submit-btn")
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
