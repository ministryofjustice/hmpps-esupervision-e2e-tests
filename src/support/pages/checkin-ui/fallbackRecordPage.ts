import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export default class FallbackRecordPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "Record your video");
  }

  startBtn(): Locator {
    return this.getByID("fallbackStartBtn");
  }

  async clickStart(): Promise<void> {
    await this.startBtn().click();
  }

  reviewVideo(): Locator {
    return this.getByID("fallbackReviewScreen");
  }

  reviewVideoContinue(): Locator {
    return this.reviewVideo().locator("[data-fallback-continue]");
  }

  async clickReviewVideoContinue(): Promise<void> {
    await this.reviewVideoContinue().click();
  }

  noMatchScreen(): Locator {
    return this.getByID("fallbackNoMatchScreen");
  }

  recordAgainLink(): Locator {
    return this.noMatchScreen().locator("[data-fallback-video]");
  }

  // Works in any language.
  secondaryActionLink(): Locator {
    return this.noMatchScreen().locator("a.govuk-button--secondary");
  }

  async clickSecondaryAction(): Promise<void> {
    await this.secondaryActionLink().click();
  }
}
