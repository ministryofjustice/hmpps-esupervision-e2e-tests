import { Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class StopCheckInsPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Stop online check ins for");
  }

  async completePage(reason: string, sensitivity = "No"): Promise<void> {
    await this.fillText("stop-checkin-reason", reason);
    await this.clickRadioByName("sensitiveContact", sensitivity);
    await this.clickContinue();
  }
}
