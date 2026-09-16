import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class CheckInConfirmationPage extends MPopBasePage {
  constructor(page: Page, restart = false) {
    super(
      page,
      restart ? "Online check ins restarted" : "Online check ins added",
    );
  }

  /** A link to the person's record in MPOP, styled as a button. */
  overviewLink(): Locator {
    return this.getQA("submit-btn");
  }

  allCasesLink(): Locator {
    return this.getQA("returnToAllCases");
  }
}
