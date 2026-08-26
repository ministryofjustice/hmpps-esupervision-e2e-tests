import test, { expect, Page } from "@playwright/test";
import SignInJourney from "../../support/journeys/manage-checkins-ui/signInJourney";
import { ManageCheckinsUiPages } from "../../support/pages/manage-checkins-ui/manageCheckinsUiPages";
import {
  BANNER_TEXT,
  FEEDBACK_SURVEY_HREF,
  FOOTER_LINKS,
} from "../../data/manage-checkins-ui/layoutConstants";

// Deliberately narrow: the header and footer belong to
// hmpps-probation-frontend-components, so only what this service owns or
// integrates is asserted here.
//
// This service has no landing page - its root redirects to MPOP and every other
// route needs a case. An unrouted path renders its error page, which extends the
// same layout, so the real page furniture is there with no case to set up.
const UNROUTED_PATH = "/no-such-page";

test.describe("manage online check ins UI layout", () => {
  let page: Page;
  let pages: ManageCheckinsUiPages;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    pages = await new SignInJourney(page).login(UNROUTED_PATH);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("header account menu button is un-hidden by the component JavaScript", async () => {
    const header = pages.header;
    await expect(header.header()).toBeVisible();

    // The button is served `hidden` and un-hidden by the header component's
    // JavaScript, so a visible one proves the assets loaded and ran.
    await expect(
      header.accountMenuToggle(),
      "Account menu button should be un-hidden by the header component's JavaScript",
    ).toBeVisible();
  });

  test("account menu has a sign out link", async () => {
    const header = pages.header;
    await header.accountMenuToggle().click();
    await expect(header.signOutLink()).toHaveAttribute("href", "/sign-out");
  });

  // The banner's link comes from this service's own FEEDBACK_BANNER_LINK, so this
  // catches a misconfigured deployment.
  test("feedback banner links to the feedback survey", async () => {
    await expect(pages.feedbackBanner.banner()).toBeVisible();
    await expect(pages.feedbackBanner.betaTag()).toHaveText("Beta");
    await expect(pages.feedbackBanner.banner()).toContainText(BANNER_TEXT);
    await expect(pages.feedbackBanner.feedbackLink()).toHaveAttribute(
      "href",
      FEEDBACK_SURVEY_HREF,
    );
  });

  test("footer shows the support links", async () => {
    await expect(pages.footer.footer()).toBeVisible();
    for (const { name, href } of FOOTER_LINKS)
      await expect(
        pages.footer.footerLink(name),
        `${name} footer link has wrong URL`,
      ).toHaveAttribute("href", href);
  });
});
