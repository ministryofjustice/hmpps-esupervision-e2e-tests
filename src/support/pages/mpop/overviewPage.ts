import { Locator, Page, expect } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import { env } from "../../../config/env";

export default class OverviewPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Overview");
  }
  async goTo(crn: string): Promise<void> {
    await this.page.goto(`${env.mpopUrl()}/case/${crn}/`);
  }
  async clickSetupOnlineCheckIns(): Promise<void> {
    const link = this.getQA("checkinCard").getByRole("link", {
      name: "Set up online check ins",
    });
    await expect(link).toBeVisible();
    await link.click();
  }
  nextCheckInDue(): Locator {
    return this.summaryValueByKey("Next check in due");
  }
}
