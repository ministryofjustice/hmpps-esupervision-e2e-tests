import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class ManageCheckInsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Online check ins");
  }

  async clickStopCheckIns(): Promise<void> {
    await this.getQA("stop-checkin-btn").click();
  }
  async clickRestartCheckIns(): Promise<void> {
    await this.getQA("restart-checkin-btn").click();
  }
}
