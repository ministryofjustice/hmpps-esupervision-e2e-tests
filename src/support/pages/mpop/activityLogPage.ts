import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class ActivityLogPage extends MPopBasePage {
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
