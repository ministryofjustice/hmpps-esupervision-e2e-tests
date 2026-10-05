import { Locator, Page } from "@playwright/test";
import { eligibilityReason } from "./eligibilityReason";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class NotEligiblePage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, /is not eligible to use online check ins/);
  }

  headingLocator(): Locator {
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

  missingTierReason(): Locator {
    return this.page.locator('[data-qa="missingTier"]');
  }
}
