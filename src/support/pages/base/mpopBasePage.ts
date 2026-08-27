import { expect, Locator, Page } from "@playwright/test";
import { FEELING_ROW_KEY, ASSISTANCE_ROW_KEY } from "../../../data/models";
import { errorSummary, fieldError } from "./errors";

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

  //Shared check in summary rows on both the review notes and reviewed checkin page
  feelingValue(): Locator {
    return this.summaryValueByKey(FEELING_ROW_KEY);
  }

  assistanceValue(): Locator {
    return this.summaryValueByKey(ASSISTANCE_ROW_KEY);
  }

  protected yesNo(value: boolean): string {
    return value ? "Yes" : "No";
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

  errorSummary(): Locator {
    return errorSummary(this.page);
  }

  fieldError(message: string): Locator {
    return fieldError(this.page, message);
  }
}
