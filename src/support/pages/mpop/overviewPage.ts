import { Locator, Page, expect } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";
import { env } from "../../../config/env";

export default class OverviewPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Overview");
  }
  async goTo(crn: string): Promise<void> {
    await this.page.goto(`${env.mpopUrl()}/case/${crn}/`);
  }
  caseHeaderDetails(): Locator {
    return this.page.locator(".person-header");
  }
  caseHeaderFields(): Locator {
    return this.caseHeaderDetails().locator("h1, li");
  }
  async clickSetupOnlineCheckIns(): Promise<void> {
    const link = this.getQA("checkinCard").getByRole("link", {
      name: "Set up online check ins",
    });
    await expect(link).toBeVisible();
    // MPOP has no test environment, so against the test environment its link still points at the
    // dev check ins UI: go to the same page on the configured one instead.
    const href = await link.getAttribute("href");
    const target = href ? new URL(href, this.page.url()) : null;
    const configured = new URL(env.manageCheckinsUiUrl());
    if (
      target &&
      target.host !== configured.host &&
      target.host !== new URL(env.mpopUrl()).host
    ) {
      await this.page.goto(
        `${configured.origin}${target.pathname}${target.search}`,
      );
      return;
    }
    await link.click();
  }

  nextCheckinValue(): Locator {
    return this.getQA("checkinValue", this.getQA("checkinCard"));
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
