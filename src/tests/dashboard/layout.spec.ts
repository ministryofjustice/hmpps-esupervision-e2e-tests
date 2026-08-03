import test, { expect, Page } from "@playwright/test";
import DashboardJourney from "../../support/journeys/dashboard/dashboardJourney";
import { DashboardPages } from "../../support/pages/dashboard/dashboardPages";
import {
  FOOTER_LINKS,
  PAGE_TITLE,
  PHASE_TAG,
  SERVICE_NAME,
} from "../../data/dashboard/dataDashboardConstants";

test.describe("data dashboard layout", () => {
  let page: Page;
  let pages: DashboardPages;
  let journey: DashboardJourney;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    journey = new DashboardJourney(page);
    pages = await journey.signIn();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("page title is set on both tabs", async () => {
    await journey.openOverall();
    await expect(page).toHaveTitle(PAGE_TITLE);

    await journey.openByRegion();
    await expect(page).toHaveTitle(PAGE_TITLE);
  });

  test("header, service navigation and phase banner are shown", async () => {
    await journey.openOverall();

    await expect(pages.layout.header()).toBeVisible();
    await expect(pages.layout.homepageLink()).toHaveAttribute("href", "/");

    await expect(pages.layout.serviceName()).toHaveText(SERVICE_NAME);

    await expect(pages.layout.phaseBanner()).toBeVisible();
    await expect(pages.layout.phaseTag()).toHaveText(PHASE_TAG);
  });

  test("footer shows the support links", async () => {
    await journey.openOverall();

    await expect(pages.layout.footer()).toBeVisible();

    for (const { name, href } of FOOTER_LINKS) {
      await expect(
        pages.layout.footerLink(name),
        `${name} footer link has wrong URL`,
      ).toHaveAttribute("href", href);
    }
  });
});
