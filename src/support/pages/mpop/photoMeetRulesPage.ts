import { expect, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class PhotoMeetRulesPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Does this photo meet the rules?");
  }

  async completePage(): Promise<void> {
    await this.submit();
  }

  async checkPhotoRulesDisplayed() {
    await expect(this.page.locator("#main-content form ul")).toBeVisible();
  }
}
