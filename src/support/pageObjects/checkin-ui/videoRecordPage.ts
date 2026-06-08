import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "./checkinBasePage";

export default class VideoRecordPage extends CheckinBasePage {
 
  constructor(page: Page) {
    super(page, "Verify your identity");
  }

  startBtn(): Locator {
    return this.getByID("startBtn");
  }
  statusTag(): Locator {
    return this.getByID("statusTag");
  }

  matchScreen(): Locator {
    return this.getByID("matchScreen");
  }
  matchHeading(): Locator {
    return this.matchScreen().locator("h1");
  }
  matchContinueLink(): Locator {
    return this.matchScreen().locator("a.govuk-button");
  }

  noMatchScreen(): Locator {
    return this.getByID("noMatchScreen");
  }
  noMatchHeading(): Locator {
    return this.noMatchScreen().locator("h1");
  }
  recordAgainLink(): Locator {
     this.page.pause()
    return this.noMatchScreen().locator('a.govuk-button',{ hasText:'Record video again'});
  }
  submitVideoAnywayLink(): Locator {
    return this.page.locator("a.govuk-button--secondary", {
      hasText: "Submit video anyway",
    });
  }

  heading(): Locator {
    return this.page.locator("h1");
  }
  continueLink(): Locator {
    return this.page.locator("a.govuk-button", { hasText: "Continue" });
  }
  tryAgainLink(): Locator {
    return this.page.locator("a.govuk-button", { hasText: "Record again" });
  }

  async clickStart(): Promise<void> {
    await this.startBtn().click();
  }

  async clickContinue(): Promise<void> {
    await this.matchContinueLink().click();
  }
  async clickSubmitAnyway(): Promise<void> {
    await this.submitVideoAnywayLink().click();
  }

    async clickMatchContinue(): Promise<void>  {
     await this.matchContinueLink().click();
  }
}
