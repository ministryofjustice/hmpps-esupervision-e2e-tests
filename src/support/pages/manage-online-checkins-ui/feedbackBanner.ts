import { Locator, Page } from "@playwright/test";

export default class FeedbackBanner {
  constructor(private readonly page: Page) {}

  banner(): Locator {
    return this.page.locator(".govuk-phase-banner");
  }

  betaTag(): Locator {
    return this.page.locator(".govuk-phase-banner__content__tag");
  }

  feedbackLink(): Locator {
    return this.banner().getByRole("link", { name: "feedback" });
  }
}
