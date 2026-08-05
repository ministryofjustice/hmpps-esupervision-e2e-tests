import { type Locator, type Page } from "@playwright/test";

export default class PhaseBanner {
  constructor(private readonly page: Page) {}

  banner(): Locator {
    return this.page.locator(".govuk-phase-banner");
  }

  phaseTag(): Locator {
    return this.page.locator(".govuk-phase-banner__content__tag");
  }
}
