import { Locator, Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class ActivityLogPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Contacts");
  }

  manageCheckinLink(): Locator {
    return this.getQA("esup-manage-link").first();
  }

  async openCheckinReview(): Promise<void> {
    await this.manageCheckinLink().click();
  }
}
