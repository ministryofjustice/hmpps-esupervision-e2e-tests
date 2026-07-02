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
  noMatchHeading(): Locator {
    return this.noMatchScreen().locator("h1");
  }
  recordAgainLink(): Locator {
    return this.noMatchScreen().locator("[data-fallback-video]");
  }
  submitVideoAnywayLink(): Locator {
    return this.page.locator("a.govuk-button--secondary", {
      hasText: "Submit video anyway",
    });
  }

  continueLink(): Locator {
    return this.page.locator("a.govuk-button", { hasText: "Continue" });
  }
  tryAgainLink(): Locator {
    return this.page.locator("a.govuk-button", { hasText: "Record again" });
  }

  async clickSubmitVideoAnyway(): Promise<void> {
    await this.submitVideoAnywayLink().click();
  }
}
