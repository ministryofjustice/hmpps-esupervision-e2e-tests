import { expect, test } from "../../support/utils/dashboard/dashboardTest";
import DashboardJourney from "../../support/journeys/dashboard/dashboardJourney";
import { DATA_DASHBOARD_HEADING } from "../../data/dashboard/layoutConstants";
import { EARLIEST_MONTH } from "../../data/dashboard/filters";
import { OVERALL_TABLES } from "../../data/dashboard/tables";
import { currentMonth } from "../../support/utils/dashboard/yearMonth";
import { assertHasData } from "../../support/utils/dashboard/dashboardTables";
import {
  assertCheckInTable,
  assertFeedbackTables,
  assertPeopleTable,
  assertTableRenders,
} from "../../support/assertions/dashboard/overallAssertions";

test.describe("data dashboard overall tab", () => {
  test("displays every table for the default month range", async ({ page }) => {
    const pages = await new DashboardJourney(page).openOverall();

    await expect(pages.overall.pageHeading()).toHaveText(
      DATA_DASHBOARD_HEADING,
    );
    await pages.overall.assertSelectedRange(EARLIEST_MONTH, currentMonth());
    await expect(pages.overall.lastUpdated()).toContainText(
      /last updated on \d{2}\/\d{2}\/\d{4} at \d{1,2}:\d{2}:\d{2}/,
    );

    for (const table of OVERALL_TABLES) {
      await assertTableRenders(pages, table);
    }
  });

  test("counts and percentages agree with each other", async ({ page }) => {
    const pages = await new DashboardJourney(page).openOverall();
    assertHasData(await pages.overall.allTotals(), "the Overall tab");

    await assertPeopleTable(pages);
    await assertCheckInTable(pages);
  });

  test("feedback response counts agree with each other", async ({ page }) => {
    test.fixme(true, "ESUP-2080: feedback response counts don't reconcile");

    const pages = await new DashboardJourney(page).openOverall();
    await assertFeedbackTables(pages);
  });
});
