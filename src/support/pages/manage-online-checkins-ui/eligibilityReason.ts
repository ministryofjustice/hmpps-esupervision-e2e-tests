import { Locator, Page } from "@playwright/test";

export function eligibilityReason(page: Page): Locator {
  return page.getByRole("main");
}
