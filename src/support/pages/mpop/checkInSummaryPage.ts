import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class CheckInSummaryPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Check your answers before adding");
  }
  summaryValueLocator(label: RegExp): Locator {
    return this.getClass("govuk-summary-list__row")
      .filter({ hasText: label })
      .locator(".govuk-summary-list__value");
  }
}
