import { expect } from "@playwright/test";
import { test } from "../../utils/dashboard/dashboardTest";
import type MatrixTable from "../../pages/dashboard/matrixTable";
import { DashboardPages } from "../../pages/dashboard/dashboardPages";
import {
  DURATION_FORMAT,
  NUMBER_FORMAT,
  PERCENTAGE_FORMAT,
  REGION_NO_PERCENTAGE,
} from "../../../data/dashboard/formats";
import {
  CHECKIN_ROWS,
  type DashboardRow,
  DURATION_ROWS,
  PEOPLE_ROW_ACTIVE,
  PEOPLE_ROW_SIGNED_UP,
  PEOPLE_ROW_STOPPED,
  REGION_ROWS_WITHOUT_PERCENTAGE,
  REGION_SUMMABLE_ROWS,
  ROW_CHECKINS_OVER_12HRS,
} from "../../../data/dashboard/rows";
import {
  REGION_MATRICES,
  REGION_MATRIX_CHECKINS,
  REGION_MATRIX_PEOPLE,
} from "../../../data/dashboard/tables";
import {
  assertCells,
  assertHasData,
  assertRowSumsToTotal,
  assertRowWithinTotal,
  parseRow,
} from "../../utils/dashboard/dashboardTables";

export const columnsFor = async (
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

export const assertRegionColumnsRenderData = async (
  pages: DashboardPages,
): Promise<void> => {
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
      expect(columns, `${title} columns differ from the first matrix`).toEqual(
        expectedColumns,
      );

      for (const row of rows) {
        const context = `${title} / ${row.overall}`;

        await assertCells(
          matrix.numberCells(row.region),
          columns,
          DURATION_ROWS.includes(row.overall) ? DURATION_FORMAT : NUMBER_FORMAT,
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
};

export const assertRegionRowTotals = async (
  pages: DashboardPages,
): Promise<void> => {
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
  }
};

export const assertCheckInsOver12hrsWithinTotal = async (
  pages: DashboardPages,
): Promise<void> => {
  const row = CHECKIN_ROWS.find(
    (candidate) => candidate.overall === ROW_CHECKINS_OVER_12HRS,
  );
  if (!row) {
    throw new Error(`${ROW_CHECKINS_OVER_12HRS} row missing from CHECKIN_ROWS`);
  }

  const matrix = pages.region.matrix(REGION_MATRIX_CHECKINS);
  const columns = await columnsFor(matrix, REGION_MATRIX_CHECKINS);

  await test.step(`"${REGION_MATRIX_CHECKINS}" / ${row.overall} stays within its total`, async () => {
    assertRowWithinTotal(
      await matrix.numberCellTexts(row.region),
      columns,
      `${REGION_MATRIX_CHECKINS} / ${row.overall}`,
    );
  });
};

export const assertRegionPeopleReconciliation = async (
  pages: DashboardPages,
): Promise<void> => {
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
};
