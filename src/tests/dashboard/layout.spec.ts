import { expect, test } from "../../support/utils/dashboard/dashboardTest";
import DashboardJourney from "../../support/journeys/dashboard/dashboardJourney";
import { DashboardPages } from "../../support/pages/dashboard/dashboardPages";
import {
  FOOTER_LINKS,
  PHASE_TAG,
  SERVICE_NAME,
} from "../../data/dashboard/layoutConstants";
import { TAB_BY_REGION, TAB_OVERALL } from "../../data/dashboard/routes";

const assertHeaderBannerFooter = async (
  pages: DashboardPages,
): Promise<void> => {
  await expect(pages.header.header()).toBeVisible();
  await expect(pages.header.serviceName()).toHaveText(SERVICE_NAME);
  await expect(pages.phaseBanner.banner()).toBeVisible();
  await expect(pages.phaseBanner.phaseTag()).toHaveText(PHASE_TAG);
  await expect(pages.footer.footer()).toBeVisible();
};

test.describe("data dashboard layout", () => {
  test("overall tab shows the header, phase banner and footer", async ({
    page,
  }) => {
    const pages = await new DashboardJourney(page).openOverall();
    await assertHeaderBannerFooter(pages);
  });

  test("region tab shows the same header, phase banner and footer", async ({
    page,
  }) => {
    const pages = await new DashboardJourney(page).openByRegion();
    await assertHeaderBannerFooter(pages);
  });

  test("footer links to the support pages", async ({ page }) => {
    const pages = await new DashboardJourney(page).openOverall();

    for (const { name, href } of FOOTER_LINKS) {
      await expect(
        pages.footer.footerLink(name),
        `${name} footer link has wrong URL`,
      ).toHaveAttribute("href", href);
    }
  });

  test("the tabs link to each other", async ({ page }) => {
    const journey = new DashboardJourney(page);
    const pages = await journey.openOverall();

    await expect(
      pages.tabs.tab(TAB_BY_REGION.name),
      `the "${TAB_BY_REGION.name}" link is missing from the "${TAB_OVERALL.name}" tab`,
    ).toBeVisible();
    await journey.openTab(TAB_BY_REGION);

    await expect(
      pages.tabs.tab(TAB_OVERALL.name),
      `the "${TAB_OVERALL.name}" link is missing from the "${TAB_BY_REGION.name}" tab`,
    ).toBeVisible();
    await journey.openTab(TAB_OVERALL);
  });
});
