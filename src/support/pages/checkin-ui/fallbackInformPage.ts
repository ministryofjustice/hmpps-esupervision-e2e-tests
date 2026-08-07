import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export default class FallbackInformPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "Confirm your identity");
  }

  // Derived from primaryButton() so it works in any language.
  continueLink(): Locator {
    return this.primaryButton().filter({ hasText: "Continue" });
  }

  async clickContinue(): Promise<void> {
    await this.continueLink().click();
  }
}
