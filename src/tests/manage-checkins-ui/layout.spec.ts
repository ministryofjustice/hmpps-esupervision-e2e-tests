import test, { expect, Page } from "@playwright/test";
import SignInJourney from "../../support/journeys/manage-checkins-ui/signInJourney";
import { ManageCheckinsUiPages } from "../../support/pages/manage-checkins-ui/manageCheckinsUiPages";
import {
  BANNER_TEXT,
  FEEDBACK_SURVEY_HREF,
  FOOTER_LINKS,
} from "../../data/manage-checkins-ui/layoutConstants";
import { env } from "../../config/env";
import { originPattern, urlPattern } from "../../support/utils/url";

// Deliberately narrow: the header and footer belong to
// hmpps-probation-frontend-components, so only what this service owns or
// integrates is asserted here.
//
// This service has no landing page - its root redirects to MPOP and every other
// route needs a case. An unrouted path renders its error page, which extends the
// same layout, so the real page furniture is there with no case to set up.
const UNROUTED_PATH = "/no-such-page";

/** Every MPOP page renders one, including its error page. */
const MPOP_PAGE_HEADING = '[data-qa="pageHeading"]';

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

  test("alerts badge shows a count in the expected format", async () => {
    // The signed-in auto test user always has alerts: test setup creates and
    // transfers CRNs, which generates them.
    const badge = pages.primaryNavigation.alertsBadge();
    await expect(badge).toHaveText(/^(\d{1,2}|99\+)$/);
  });

  test("cases nav link takes the practitioner to their case list in MPOP", async ({
    page: ownPage,
  }) => {
    const ownPages = await new SignInJourney(ownPage).login(UNROUTED_PATH);
    await ownPages.primaryNavigation.navLink("Cases").click();
    await expect(ownPage).toHaveURL(urlPattern(env.mpopUrl(), "/case"));
  });

  test("search nav link takes the practitioner to MPOP's search page", async ({
    page: ownPage,
  }) => {
    const ownPages = await new SignInJourney(ownPage).login(UNROUTED_PATH);
    await ownPages.primaryNavigation.navLink("Search").click();
    await expect(ownPage).toHaveURL(urlPattern(env.mpopUrl(), "/search"));
  });

  test("alerts nav link takes the practitioner to their alerts in MPOP", async ({
    page: ownPage,
  }) => {
    const ownPages = await new SignInJourney(ownPage).login(UNROUTED_PATH);
    await ownPages.primaryNavigation.navLink("Alerts").click();
    await expect(ownPage).toHaveURL(urlPattern(env.mpopUrl(), "/alerts"));
  });

  // Checks the Home nav link leaves this service for MPOP.
  test("home nav link takes the practitioner to MPOP's home page", async ({
    page: ownPage,
  }) => {
    const ownPages = await new SignInJourney(ownPage).login(UNROUTED_PATH);
    const home = ownPages.primaryNavigation.navLink("Home");
    await expect(
      home,
      "Home link should be in the primary navigation",
    ).toBeVisible();
    await home.click();
    await expect(ownPage, "Home nav link should leave for MPOP").toHaveURL(
      originPattern(env.mpopUrl()),
    );
  });

  // Checks this service's "/" and case list both redirect out to MPOP.
  test("this service's homepage URL and case list redirect the practitioner to MPOP", async ({
    page: ownPage,
  }) => {
    await new SignInJourney(ownPage).login(UNROUTED_PATH);
    const base = env.manageCheckinsUiUrl().replace(/\/$/, "");

    await ownPage.goto(`${base}/`);
    await expect(
      ownPage,
      "this service's homepage URL should redirect to MPOP",
    ).toHaveURL(originPattern(env.mpopUrl()));
    // Checks MPOP rendered a heading, so the redirect reached a page of some
    // kind. Not which page - MPOP's error page has one too.
    await expect(
      ownPage.locator(MPOP_PAGE_HEADING),
      "MPOP should render a page after the homepage redirect",
    ).toBeVisible();

    await ownPage.goto(`${base}/case`);
    await expect(
      ownPage,
      "the case list should redirect to MPOP's case list",
    ).toHaveURL(urlPattern(env.mpopUrl(), "/case"));
    await expect(
      ownPage.locator(MPOP_PAGE_HEADING),
      "MPOP should render a page after the case list redirect",
    ).toBeVisible();
  });
});
