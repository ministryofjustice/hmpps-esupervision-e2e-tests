import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export default class HomePage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "Check in with your probation officer");
  }

  startButton(): Locator {
    return this.page.getByRole("button", { name: "Start now" });
  }

  async clickStart(): Promise<void> {
    await this.startButton().click();
  }
}
