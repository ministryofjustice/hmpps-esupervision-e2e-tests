import { type Locator, type Page } from "@playwright/test";

export default class Header {
  constructor(private readonly page: Page) {}

  header(): Locator {
    return this.page.locator(".govuk-header");
  }

  serviceName(): Locator {
    return this.page.locator(".govuk-service-navigation__service-name");
  }
}
