import { Locator, Page, expect } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";
import { env } from "../../../config/env";

const SET_UP_LINK = "Set up online check ins";
const MANAGE_LINK = /Manage online check ins|View all online check in details/;

export default class OverviewPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Overview");
  }
  async goTo(crn: string): Promise<void> {
    await this.page.goto(`${env.mpopUrl()}/case/${crn}/`);
  }

  checkinCard(): Locator {
    return this.getQA("checkinCard");
  }

  setupLink(): Locator {
    return this.checkinCard().getByRole("link", { name: SET_UP_LINK });
  }

  manageLink(): Locator {
    return this.checkinCard().getByRole("link", { name: MANAGE_LINK });
  }

  async clickSetupOnlineCheckIns(): Promise<void> {
    const link = this.setupLink();
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    const start = href ? new URL(href, this.page.url()) : null;
    await link.click();
    await this.landOnConfiguredCheckinsUi(start);
  }

  async openSetupDirectly(crn: string): Promise<void> {
    const start = new URL(
      `${env.mpopUrl()}/case/${crn}/appointments/check-in/eligibility-check`,
    );
    await this.page.goto(start.toString());
    await this.landOnConfiguredCheckinsUi(start);
  }

  private async landOnConfiguredCheckinsUi(start: URL | null): Promise<void> {
    const configured = new URL(env.manageCheckinsUiUrl());
    // Every setup page, on MPOP or a check ins UI, is under .../check-in/
    await this.page.waitForURL((url) => url.pathname.includes("/check-in/"));
    const landed = new URL(this.page.url());
    if (
      start &&
      landed.host !== configured.host &&
      landed.host !== new URL(env.mpopUrl()).host
    ) {
      await this.page.goto(
        `${configured.origin}${start.pathname}${start.search}`,
      );
    }
  }

  async assertCheckinCardNotEligible(reason: string | RegExp): Promise<void> {
    await expect(
      this.setupLink(),
      "Online check ins card should not offer setup to a person who is not eligible",
    ).toHaveCount(0);
    await expect(this.nextCheckinValue()).toContainText(reason);
  }

  nextCheckinValue(): Locator {
    return this.getQA("checkinValue", this.checkinCard());
  }

  async clickActivityLogTab(): Promise<void> {
    await this.getQA("activityLogTab").getByRole("link").click();
  }

  /** Count checked first, because the either/or name would match twice if the
   *  card ever showed both - and Playwright's strict mode error wouldn't tell you
   *  that was the problem. */
  async clickManageOnlineCheckIns(): Promise<void> {
    const link = this.manageLink();
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
