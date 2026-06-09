import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export default class VideoRecordPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "Record your video");
  }

  startBtn(): Locator {
    return this.getByID("startBtn");
  }

  async clickStart(): Promise<void> {
    await this.startBtn().click();
  }
}
