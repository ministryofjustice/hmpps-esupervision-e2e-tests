import { expect } from "@playwright/test";
import { test } from "../../utils/dashboard/dashboardTest";
import { DashboardPages } from "../../pages/dashboard/dashboardPages";
import {
  DURATION_FORMAT,
  NUMBER_FORMAT,
  OVERALL_NO_PERCENTAGE,
  PERCENTAGE_FORMAT,
} from "../../../data/dashboard/formats";
import {
  DURATION_ROWS,
  ROW_ACTIVE,
  ROW_CHECKINS_COMPLETED,
  ROW_CHECKINS_NOT_COMPLETED,
  ROW_SIGNED_UP,
  ROW_STOPPED,
} from "../../../data/dashboard/rows";
import {
  FEEDBACK_NOT_ANSWERED_ROW,
  FEEDBACK_TABLE_ROWS,
  FEEDBACK_TOTAL_ROW,
  type OverallTableSpec,
  TABLE_CHECKINS,
  TABLE_FEEDBACK_RESPONSES,
  TABLE_PEOPLE,
} from "../../../data/dashboard/tables";
import { parseCount } from "../../utils/dashboard/dashboardStatsValues";
import {
  answeredDenominator,
  assertPercentageMatchesCount,
  rowNamed,
} from "../../utils/dashboard/dashboardTables";

export const assertTableRenders = async (
  pages: DashboardPages,
  {
    caption,
    rows,
    hasPercentageColumn,
    rowsWithoutPercentage,
  }: OverallTableSpec,
): Promise<void> => {
  await test.step(`"${caption}" table`, async () => {
    const table = pages.overall.table(caption);
    await expect(table.locator(), `${caption} table`).toBeVisible();
    expect(await table.rowLabels(), `${caption} rows`).toEqual(rows);

    for (const label of rows) {
      await expect(table.totalCell(label), `${caption} / ${label}`).toHaveText(
        DURATION_ROWS.includes(label) ? DURATION_FORMAT : NUMBER_FORMAT,
      );

      if (!hasPercentageColumn) continue;

      await expect(
        table.percentageCell(label),
        `${caption} / ${label} percentage`,
      ).toHaveText(
        rowsWithoutPercentage.includes(label)
          ? OVERALL_NO_PERCENTAGE
          : PERCENTAGE_FORMAT,
      );
    }
  });
};

export const assertPeopleTable = async (
  pages: DashboardPages,
): Promise<void> => {
  const rows = await pages.overall.table(TABLE_PEOPLE).rowValues();
  const signedUp = parseCount(
    rowNamed(rows, ROW_SIGNED_UP, TABLE_PEOPLE).total,
  );
  const active = rowNamed(rows, ROW_ACTIVE, TABLE_PEOPLE);
  const stopped = rowNamed(rows, ROW_STOPPED, TABLE_PEOPLE);

  await test.step("active plus stopped equals the number signed up", async () => {
    expect(
      parseCount(active.total) + parseCount(stopped.total),
      "active plus stopped does not equal the number signed up",
    ).toEqual(signedUp);
  });

  await test.step("no count is negative", async () => {
    for (const row of [active, stopped]) {
      expect(
        parseCount(row.total),
        `${row.label} is negative (${row.total})`,
      ).toBeGreaterThanOrEqual(0);
    }
  });

  await test.step("percentages match their own counts", async () => {
    for (const row of [active, stopped]) {
      assertPercentageMatchesCount(row, signedUp, TABLE_PEOPLE);
    }
  });
};

export const assertCheckInTable = async (
  pages: DashboardPages,
): Promise<void> => {
  await test.step("check-in percentages match their own counts", async () => {
    const rows = await pages.overall.table(TABLE_CHECKINS).rowValues();
    const completed = rowNamed(rows, ROW_CHECKINS_COMPLETED, TABLE_CHECKINS);
    const notCompleted = rowNamed(
      rows,
      ROW_CHECKINS_NOT_COMPLETED,
      TABLE_CHECKINS,
    );
    const due = parseCount(completed.total) + parseCount(notCompleted.total);
    for (const row of [completed, notCompleted]) {
      assertPercentageMatchesCount(row, due, TABLE_CHECKINS);
    }
  });
};

export const assertFeedbackTables = async (
  pages: DashboardPages,
): Promise<void> => {
  const responses = parseCount(
    await pages.overall
      .table(TABLE_FEEDBACK_RESPONSES)
      .totalCell(FEEDBACK_TOTAL_ROW)
      .innerText(),
  );

  for (const { caption, multiSelect } of FEEDBACK_TABLE_ROWS) {
    await test.step(`"${caption}" answers agree with the number of responses`, async () => {
      const rows = await pages.overall.table(caption).rowValues();
      const notAnswered = parseCount(
        rowNamed(rows, FEEDBACK_NOT_ANSWERED_ROW, caption).total,
      );
      const answered = answeredDenominator(rows, FEEDBACK_NOT_ANSWERED_ROW);

      for (const row of rows) {
        if (row.label === FEEDBACK_NOT_ANSWERED_ROW) continue;
        assertPercentageMatchesCount(row, answered, caption);
      }

      if (multiSelect) {
        expect(
          answered + notAnswered,
          `${caption} counts add up to fewer than the number of responses`,
        ).toBeGreaterThanOrEqual(responses);
        expect(
          answered,
          `${caption} counts add up to more answers than there are options to give`,
        ).toBeLessThanOrEqual(responses * (rows.length - 1));
      } else {
        expect(
          answered + notAnswered,
          `${caption} rows do not add up to the number of responses`,
        ).toEqual(responses);
      }
    });
  }
};
