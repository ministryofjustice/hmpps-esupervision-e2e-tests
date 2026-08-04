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

const MAX_ATTEMPTS = 3;

interface OverallFigure {
  matrix: MatrixTitle;
  row: DashboardRow;
  total: string;
}

test.describe("data dashboard region totals match the overall tab", () => {
  test("every region Total matches its overall figure", async ({ page }) => {
    const journey = new DashboardJourney(page);
    const monthTo = currentMonth();

    let overallSnapshot = "";
    let regionSnapshot = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const pages = await journey.openOverall(EARLIEST_MONTH, monthTo);
      assertHasData(await pages.overall.allTotals(), "the Overall tab");

      overallSnapshot = await pages.overall.snapshotTime();
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
      regionSnapshot = await pages.region.snapshotTime();

      if (regionSnapshot === overallSnapshot) {
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
        return;
      }
    }

    throw new Error(
      `The stats snapshot changed between reading the two tabs on all ${MAX_ATTEMPTS} attempts ` +
        `(overall: "${overallSnapshot}", region: "${regionSnapshot}"), so the tabs could not be ` +
        `compared. `,
    );
  });
});
