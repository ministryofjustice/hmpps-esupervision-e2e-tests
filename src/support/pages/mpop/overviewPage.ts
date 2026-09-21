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

  async clickActivityLogTab(): Promise<void> {
    await this.getQA("activityLogTab").getByRole("link").click();
  }

  /** The card calls this link "Manage online check ins" while check ins are
   *  running, and "View all online check in details" once they're stopped. Same
   *  page either way.
   *
   *  Count checked first, because the either/or name would match twice if the
   *  card ever showed both - and Playwright's strict mode error wouldn't tell you
   *  that was the problem. */
  async clickManageOnlineCheckIns(): Promise<void> {
    const link = this.getQA("checkinCard").getByRole("link", {
      name: /Manage online check ins|View all online check in details/,
    });
    await expect(
      link,
      'Check in card should have exactly one "Manage online check ins" / ' +
        '"View all online check in details" link - none means the offender ' +
        "isn't set up, more than one means the card has changed",
    ).toHaveCount(1);
    await expect(
      link,
      "Manage online check ins link should be visible",
    ).toBeVisible();
    await link.click();
  }
}
