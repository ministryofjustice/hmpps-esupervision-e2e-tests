import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class StopCheckInsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Stop online check ins for");
  }

  async completePage(reason: string, sensitivity = "No"): Promise<void> {
    await this.fillText("stop-checkin-reason", reason);
    await this.clickRadioByName("sensitiveContact", sensitivity);
    await this.clickContinue();
  }
}
