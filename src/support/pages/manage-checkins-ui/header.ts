import { Locator, Page } from "@playwright/test";

export default class Header {
  constructor(private readonly page: Page) {}

  header(): Locator {
    return this.page.locator("header.probation-common-header");
  }

  userName(): Locator {
    return this.header().locator(
      '[data-qa="probation-common-header-user-name"]',
    );
  }

  signOutLink(): Locator {
    return this.header().locator('a[href*="sign-out"]');
  }
}
