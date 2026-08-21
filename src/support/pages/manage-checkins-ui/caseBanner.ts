import { Locator, Page } from "@playwright/test";

export default class CaseBanner {
  constructor(private readonly page: Page) {}

  crn(): Locator {
    return this.page.locator('[data-qa="crn"]');
  }

  tierLink(): Locator {
    return this.page.locator('[data-qa="tierLink"]');
  }
}
