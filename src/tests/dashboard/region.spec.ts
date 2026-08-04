import { test } from "../../support/utils/dashboard/dashboardTest";
import DashboardJourney from "../../support/journeys/dashboard/dashboardJourney";
import {
  assertRegionColumnsRenderData,
  assertRegionPeopleReconciliation,
  assertRegionRowTotals,
} from "../../support/assertions/dashboard/regionAssertions";

test.describe("data dashboard region tab", () => {
  test("displays a value under every region column", async ({ page }) => {
    const pages = await new DashboardJourney(page).openByRegion();
    await assertRegionColumnsRenderData(pages);
  });

  // ESUP-2080: check-ins over 12hrs exceed their bounded total
  test("region counts sum to their totals", async ({ page }) => {
    const pages = await new DashboardJourney(page).openByRegion();
    await assertRegionRowTotals(pages);
  });

  test("active plus stopped equals signed up in every region", async ({
    page,
  }) => {
    const pages = await new DashboardJourney(page).openByRegion();
    await assertRegionPeopleReconciliation(pages);
  });
});
