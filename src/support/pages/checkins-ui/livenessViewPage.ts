import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export default class LivenessViewPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "Confirm your identity");
  }

  submitAnywayButton(): Locator {
    return this.page.getByRole("button", { name: /Submit anyway/ });
  }

  async submitAnyway(): Promise<void> {
    return this.submitAnywayButton().click();
  }
}
