import { Locator, Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class CheckInConfirmationPage extends PractitionerBasePage {
  constructor(page: Page, restart = false) {
    super(
      page,
      restart ? "Online check ins restarted" : "Online check ins set up",
    );
  }

  /** A link to the person's record in MPOP. */
  overviewLink(): Locator {
    return this.getQA("submit-btn");
  }

  panel(): Locator {
    return this.getClass("govuk-panel");
  }

  scheduleCheckInButton(): Locator {
    return this.page.getByRole("link", { name: "Schedule a check in" });
  }

  async clickScheduleCheckIn(): Promise<void> {
    await this.scheduleCheckInButton().click();
  }

  allCasesLink(): Locator {
    return this.getQA("returnToAllCases");
  }
}
