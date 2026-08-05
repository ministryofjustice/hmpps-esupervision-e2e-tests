import { expect, test } from "../../support/utils/dashboard/dashboardTest";
import DashboardJourney from "../../support/journeys/dashboard/dashboardJourney";
import { EARLIEST_MONTH } from "../../data/dashboard/filters";
import {
  DATA_DASHBOARD_PATH,
  TAB_BY_REGION,
} from "../../data/dashboard/routes";
import { currentMonth } from "../../support/utils/dashboard/yearMonth";
import { assertHasData } from "../../support/utils/dashboard/dashboardTables";

test.describe("data dashboard month filter", () => {
  test("narrowing the range changes the figures", async ({ page }) => {
    const journey = new DashboardJourney(page);
    const pages = await journey.openOverall(EARLIEST_MONTH, currentMonth());

    const fullRange = await pages.overall.allTotals();
    assertHasData(fullRange, "the full range");

    await journey.applyRange(pages.overall, EARLIEST_MONTH, EARLIEST_MONTH);
    await pages.overall.assertSelectedRange(EARLIEST_MONTH, EARLIEST_MONTH);

    expect(
      await pages.overall.allTotals(),
      "a single month returned the same figures as the full range",
    ).not.toEqual(fullRange);
  });

  test("the selected range survives moving between tabs", async ({ page }) => {
    const journey = new DashboardJourney(page);
    const pages = await journey.openOverall(EARLIEST_MONTH, EARLIEST_MONTH);
    await pages.overall.assertSelectedRange(EARLIEST_MONTH, EARLIEST_MONTH);

    await journey.openTab(TAB_BY_REGION);
    await pages.region.assertSelectedRange(EARLIEST_MONTH, EARLIEST_MONTH);
  });

  test("shows an error when the from month is after the to month", async ({
    page,
  }) => {
    const journey = new DashboardJourney(page);
    const pages = await journey.openOverall(EARLIEST_MONTH, currentMonth());

    await pages.overall.selectMonthRange(currentMonth(), EARLIEST_MONTH);
    await pages.overall.applyFilters(currentMonth(), EARLIEST_MONTH);

    await expect(pages.overall.errorSummary()).toBeVisible();
    await expect(pages.overall.errorSummary()).toContainText(
      "The 'From' month must be before the 'To' month",
    );
  });

  test("reset filters returns to the default range", async ({ page }) => {
    const journey = new DashboardJourney(page);
    const pages = await journey.openOverall(EARLIEST_MONTH, EARLIEST_MONTH);

    await expect(pages.overall.resetFiltersLink()).toHaveAttribute(
      "href",
      DATA_DASHBOARD_PATH,
    );

    await pages.overall.resetFiltersLink().click();
    await page.waitForURL((url) => url.pathname === DATA_DASHBOARD_PATH);
    await pages.overall.assertSelectedRange(EARLIEST_MONTH, currentMonth());
  });
});
