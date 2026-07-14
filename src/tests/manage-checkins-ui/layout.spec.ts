import test, { expect, Page } from "@playwright/test";
import SignInJourney from "../../support/journeys/manage-checkins-ui/signInJourney";
import { ManageCheckinsUiPages } from "../../support/pages/manage-checkins-ui/manageCheckinsUiPages";
import {
  BANNER_TEXT,
  FEEDBACK_SURVEY_HREF,
  FOOTER_LINKS,
} from "../../data/manage-checkins-ui/layoutConstants";

test.describe("manage online check ins UI layout", () => {
  let page: Page;
  let pages: ManageCheckinsUiPages;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    pages = await new SignInJourney(page).login();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("header is shown with a sign out link", async () => {
    await expect(pages.header.header()).toBeVisible();
    await expect(pages.header.signOutLink().first()).toHaveAttribute(
      "href",
      /sign-out/,
    );
  });

  test("feedback banner link to the feedback survey", async () => {
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
