import { Locator, Page } from "@playwright/test";

export default abstract class BasePage {
  constructor(protected readonly page: Page) {}

  getSummaryValue(key: string): Locator {
    return this.page
      .locator(".govuk-summary-list__key", { hasText: key })
      .locator("..")
      .locator(".govuk-summary-list__value");
  }

  getSummaryChangeLink(key: string): Locator {
    return this.page
      .locator(".govuk-summary-list__key", { hasText: key })
      .locator("..")
      .locator(".govuk-summary-list__actions")
      .locator("a", { hasText: "Change" });
  }

  getByID(id: string, locator: Locator | Page = this.page) {
    return locator.locator(`[id="${id}"]`);
  }
}
