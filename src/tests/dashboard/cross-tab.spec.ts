import { expect, test } from "../../support/utils/dashboard/dashboardTest";
import DashboardJourney from "../../support/journeys/dashboard/dashboardJourney";
import { EARLIEST_MONTH } from "../../data/dashboard/filters";
import { TAB_BY_REGION } from "../../data/dashboard/routes";
import type { DashboardRow } from "../../data/dashboard/rows";
import {
  CROSS_TAB_TABLES,
  type MatrixTitle,
} from "../../data/dashboard/tables";
import { currentMonth } from "../../support/utils/dashboard/yearMonth";
import { assertHasData } from "../../support/utils/dashboard/dashboardTables";

interface OverallFigure {
  matrix: MatrixTitle;
  row: DashboardRow;
  total: string;
}

test.describe("data dashboard region totals match the overall tab", () => {
  test("every region Total matches its overall figure", async ({ page }) => {
    const journey = new DashboardJourney(page);
    const monthTo = currentMonth();

    const pages = await journey.openOverall(EARLIEST_MONTH, monthTo);
    assertHasData(await pages.overall.allTotals(), "the Overall tab");

    const expected: OverallFigure[] = [];
    for (const { caption, matrix, rows } of CROSS_TAB_TABLES) {
      for (const row of rows) {
        const total = await pages.overall
          .table(caption)
          .totalCell(row.overall)
          .innerText();
        expected.push({ matrix, row, total: total.trim() });
      }
    }

    await journey.openTab(TAB_BY_REGION);
    await pages.region.assertSelectedRange(EARLIEST_MONTH, monthTo);

    for (const { matrix, row, total } of expected) {
      const cells = await pages.region
        .matrix(matrix)
        .numberCellTexts(row.region);
      expect(
        cells.length,
        `${matrix} / ${row.overall}: no row matched ${row.region}`,
      ).toBeGreaterThan(0);

      const [regionTotal] = cells;
      expect(
        regionTotal,
        `${matrix} / ${row.overall}: region Total is ${regionTotal} but the overall tab shows ${total}`,
      ).toEqual(total);
    }
  });
});
