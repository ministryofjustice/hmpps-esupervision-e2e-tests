import { Locator, Page } from "@playwright/test";
import { eligibilityReason } from "./eligibilityReason";

export default class NotEligiblePage {
  constructor(private readonly page: Page) {}

  heading(): Locator {
    return this.page.getByRole("heading", {
      name: /is not eligible to use online check ins/,
    });
  }

  reason(): Locator {
    return eligibilityReason(this.page);
  }

  /** Listed when more than one fact rules the person out. */
  reasonBullets(): Locator {
    return this.page.locator('[data-qa="reasonBullets"] li');
  }

  backLink(): Locator {
    return this.page.getByRole("link", { name: "Back", exact: true });
  }

  overviewButton(): Locator {
    return this.page.getByRole("button", { name: /^Go to .+'s overview$/ });
  }

  missingTierReason(): Locator {
    return this.page.locator('[data-qa="missingTier"]');
  }
}
