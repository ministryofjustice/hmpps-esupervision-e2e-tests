import { Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class PhotoMeetRulesPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Does this photo meet the rules?");
  }

  async completePage(): Promise<void> {
    await this.clickContinue();
  }
}
