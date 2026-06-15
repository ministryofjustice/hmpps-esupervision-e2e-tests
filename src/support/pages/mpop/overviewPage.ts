import { Page, expect } from "@playwright/test";
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

  async clickViewAllOnlineCheckinDetails(): Promise<void> {
    const link = this.getQA("checkinCard").getByRole("link", {
      name: "View all online check in details",
    });
    await expect(
      link,
      "View all online check in details link not found - offender may not be set up",
    ).toBeVisible();
    await link.click();
  }
}
