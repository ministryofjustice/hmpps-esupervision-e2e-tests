import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export default class VideoViewPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "We cannot confirm this is you");
  }

  noMatchScreen(): Locator {
    return this.getByID("noMatchScreen");
  }
  noMatchHeading(): Locator {
    return this.noMatchScreen().locator("h1");
  }
  recordAgainLink(): Locator {
    return this.noMatchScreen().locator("a.govuk-button", {
      hasText: "Record video again",
    });
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
