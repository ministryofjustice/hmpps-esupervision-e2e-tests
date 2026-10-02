import { Locator, Page } from "@playwright/test";

export function eligibilityReason(page: Page): Locator {
  return page.locator("main p.govuk-body").first();
}
