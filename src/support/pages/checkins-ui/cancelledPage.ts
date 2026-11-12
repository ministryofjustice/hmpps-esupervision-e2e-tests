import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export default class CancelledPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "Your check in has been cancelled by your probation officer");
  }

  intro(): Locator {
    return this.page.getByText(
      "Contact your probation officer for help or if you have any questions.",
    );
  }
}
