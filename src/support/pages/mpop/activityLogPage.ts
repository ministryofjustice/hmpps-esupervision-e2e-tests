import { Locator, Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class ActivityLogPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Contacts");
  }

  manageCheckinLink(checkinUuid?: string): Locator {
    if (checkinUuid) {
      return this.getQA("esup-manage-link")
        .locator(
          `xpath=self::a[contains(substring-before(concat(@href, '?'), '?'), '/appointments/${checkinUuid}/check-in/update')]`,
        )
        .first();
    }
    return this.getQA("esup-manage-link").first();
  }

  async openCheckinReview(checkinUuid?: string): Promise<void> {
    await this.manageCheckinLink(checkinUuid).click();
  }
}
