import { Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class CancelCheckinPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Cancel upcoming online check in for");
  }

  async completePage(reason: string): Promise<void> {
    await this.fillText("cancel-checkin-reason", reason);
    await this.clickRadioByName(
      "cancel-checkin-sensitive",
      "Yes, it includes sensitive information",
    );
    await this.clickContinue();
  }
}
