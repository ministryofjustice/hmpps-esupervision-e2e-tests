import { expect, test } from "../../support/utils/dashboard/dashboardTest";
import DashboardJourney from "../../support/journeys/dashboard/dashboardJourney";
import MatrixTable from "../../support/pages/dashboard/matrixTable";
import {
  DURATION_FORMAT,
  NUMBER_FORMAT,
  PERCENTAGE_FORMAT,
  REGION_NO_PERCENTAGE,
} from "../../data/dashboard/formats";
import {
  type DashboardRow,
  DURATION_ROWS,
  PEOPLE_ROW_ACTIVE,
  PEOPLE_ROW_SIGNED_UP,
  PEOPLE_ROW_STOPPED,
  REGION_ROWS_BOUNDED_BY_TOTAL,
  REGION_ROWS_WITHOUT_PERCENTAGE,
  REGION_SUMMABLE_ROWS,
} from "../../data/dashboard/rows";
import {
  REGION_MATRICES,
  REGION_MATRIX_PEOPLE,
} from "../../data/dashboard/tables";
import {
  assertCells,
  assertHasData,
  assertRowSumsToTotal,
  assertRowWithinTotal,
  parseRow,
} from "../../support/utils/dashboard/dashboardTables";

// Guarded so a missing matrix fails here rather than later in the maths.
const columnsFor = async (
  matrix: MatrixTable,
  title: string,
): Promise<string[]> => {
  const columns = await matrix.columnNames();
  expect(
    columns.length,
    `${title} rendered no provider columns`,
  ).toBeGreaterThan(1);
  return columns;
};

test.describe("data dashboard region tab", () => {
  test("displays a value under every region column", async ({ page }) => {
    const pages = await new DashboardJourney(page).openByRegion();
    const [first] = REGION_MATRICES;
    const expectedColumns = await columnsFor(
      pages.region.matrix(first.title),
      first.title,
    );

    expect(expectedColumns, "a column has no heading").not.toContain("");

    for (const { title, rows } of REGION_MATRICES) {
      await test.step(`"${title}" matrix`, async () => {
        const matrix = pages.region.matrix(title);
        await expect(matrix.heading(), `${title} matrix`).toBeVisible();

        const columns = await columnsFor(matrix, title);
        expect(
          columns,
          `${title} columns differ from the first matrix`,
        ).toEqual(expectedColumns);

        for (const row of rows) {
          const context = `${title} / ${row.overall}`;

          await assertCells(
            matrix.numberCells(row.region),
            columns,
            DURATION_ROWS.includes(row.overall)
              ? DURATION_FORMAT
              : NUMBER_FORMAT,
            context,
          );

          await assertCells(
            matrix.percentageCells(row.region),
            columns,
            REGION_ROWS_WITHOUT_PERCENTAGE.includes(row.overall)
              ? REGION_NO_PERCENTAGE
              : PERCENTAGE_FORMAT,
            `${context} percentage`,
          );
        }
      });
    }
  });

  test("region counts sum to their totals", async ({ page }) => {
    test.fail(
      true,
      "ESUP-2080: check-ins over 12hrs exceed their bounded total",
    );

    const pages = await new DashboardJourney(page).openByRegion();
    assertHasData(
      await pages.region
        .matrix(REGION_MATRIX_PEOPLE)
        .numberCellTexts(PEOPLE_ROW_SIGNED_UP.region),
      "the region tab",
    );

    for (const { title, rows } of REGION_MATRICES) {
      const matrix = pages.region.matrix(title);
      const columns = await columnsFor(matrix, title);

      await test.step(`"${title}" matrix sums to its totals`, async () => {
        for (const row of rows.filter((candidate) =>
          REGION_SUMMABLE_ROWS.includes(candidate.overall),
        )) {
          assertRowSumsToTotal(
            await matrix.numberCellTexts(row.region),
            columns,
            `${title} / ${row.overall}`,
          );
        }
      });

      await test.step(`"${title}" bounded rows stay within their totals`, async () => {
        for (const row of rows.filter((candidate) =>
          REGION_ROWS_BOUNDED_BY_TOTAL.includes(candidate.overall),
        )) {
          assertRowWithinTotal(
            await matrix.numberCellTexts(row.region),
            columns,
            `${title} / ${row.overall}`,
          );
        }
      });
    }
  });

  test("active plus stopped equals signed up in every region", async ({
    page,
  }) => {
    const pages = await new DashboardJourney(page).openByRegion();
    const matrix = pages.region.matrix(REGION_MATRIX_PEOPLE);
    const columns = await columnsFor(matrix, REGION_MATRIX_PEOPLE);

    const countsFor = async (row: DashboardRow): Promise<number[]> =>
      parseRow(
        await matrix.numberCellTexts(row.region),
        columns,
        `${REGION_MATRIX_PEOPLE} / ${row.overall}`,
      );

    const signedUp = await countsFor(PEOPLE_ROW_SIGNED_UP);
    const active = await countsFor(PEOPLE_ROW_ACTIVE);
    const stopped = await countsFor(PEOPLE_ROW_STOPPED);

    assertHasData(signedUp.map(String), `${REGION_MATRIX_PEOPLE} signed up`);
    for (const [index, column] of columns.entries()) {
      expect(
        active[index] + stopped[index],
        `${column}: active (${active[index]}) + stopped (${stopped[index]}) should equal signed up (${signedUp[index]})`,
      ).toEqual(signedUp[index]);
    }
  });
});
