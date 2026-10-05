import { Locator, Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class CheckInConfirmationPage extends PractitionerBasePage {
  constructor(page: Page, restart = false) {
    super(
      page,
      restart ? "Online check ins restarted" : "Online check ins added",
    );
  }

  /** A link to the person's record in MPOP. */
  overviewLink(): Locator {
    return this.getQA("submit-btn");
  }

  allCasesLink(): Locator {
    return this.getQA("returnToAllCases");
  }
}
