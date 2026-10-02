import { Locator, Page } from "@playwright/test";

export default class CaseBanner {
  constructor(private readonly page: Page) {}

  details(): Locator {
    return this.page.locator(".pop-header__details");
  }

  fields(): Locator {
    return this.details().locator("h1, li");
  }

  crn(): Locator {
    return this.page.locator('[data-qa="crn"]');
  }

  tierLink(): Locator {
    return this.page.locator('[data-qa="tierLink"]');
  }
}
